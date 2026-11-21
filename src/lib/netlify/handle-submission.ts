import { budgetRequestSchema } from "@/lib/budget/schema";
import { serviceZone } from "@/lib/budget/zone";
import { aftercareSchema } from "@/lib/forms/aftercare";
import { feedbackSchema } from "@/lib/forms/feedback";
import { sendMail, type SmtpConfig } from "@/lib/email/send";
import {
  buildAftercareConfirmation,
  buildAftercareNotification,
  buildBudgetConfirmation,
  buildBudgetNotification,
  buildFeedbackNotification,
  buildFeedbackThanks,
  type Attachment,
  type EmailMessage,
} from "@/lib/email/templates";
import { esc, rows, section, shell, hero } from "@/lib/email/layout";
import { canPublish, moderationUrl, newReviewId, signAction, toPublicReview } from "@/lib/reviews/public";
import type { ReviewStore } from "./reviews-store";

/**
 * Lógica de la función de Netlify `formularios` (evento formSubmitted):
 * convierte cada envío de Netlify Forms en emails visuales para Excellence
 * Reformas y, si procede, una confirmación para el cliente.
 */

export type HandlerDeps = {
  smtp: SmtpConfig | null;
  notifyTo: string[];
  confirmClient: boolean;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (msg: string, extra?: unknown) => void;
  /** Opiniones públicas: dónde se guardan y URL del sitio para el enlace «Ocultar». */
  reviews?: { store: ReviewStore; siteUrl?: string };
};

export type HandlerResult = { form: string; sent: string[]; skipped?: string; published?: boolean };

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 18 * 1024 * 1024;

export function depsFromEnv(get: (k: string) => string | undefined): HandlerDeps {
  const to = (get("NOTIFY_EMAIL_TO") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const host = get("SMTP_HOST");
  const from = get("MAIL_FROM") || get("SMTP_USER");
  const port = Number(get("SMTP_PORT") || 587);
  const secureRaw = get("SMTP_SECURE");
  // Con usuario pero sin contraseña (p. ej., falta la contraseña de aplicación de Gmail) no se intenta enviar.
  const ready = !!host && !!from && !(get("SMTP_USER") && !get("SMTP_PASS"));
  return {
    smtp: ready ? { host, port, secure: secureRaw ? secureRaw === "true" : port === 465, user: get("SMTP_USER") || undefined, pass: get("SMTP_PASS") || undefined, from } : null,
    notifyTo: to,
    confirmClient: get("SEND_CLIENT_CONFIRMATION") !== "false",
  };
}

const madrid = (d: Date) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", dateStyle: "full", timeStyle: "short" }).format(d);

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function parseJson(v: unknown): unknown {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/** Netlify entrega los archivos como URL, como objeto {url, filename, type} o como JSON de ese objeto. */
export function fileRef(v: unknown): { url: string; filename?: string; type?: string } | null {
  if (!v) return null;
  if (typeof v === "string") {
    if (/^https?:\/\//.test(v)) return { url: v };
    return fileRef(parseJson(v));
  }
  if (typeof v === "object" && v !== null && "url" in v && typeof (v as { url: unknown }).url === "string") {
    const o = v as { url: string; filename?: string; type?: string };
    return { url: o.url, filename: o.filename, type: o.type };
  }
  return null;
}

async function collectPhotos(data: Record<string, unknown>, fields: string[], prefix: string, deps: HandlerDeps) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const attachments: Attachment[] = [];
  const links: string[] = [];
  let total = 0;
  for (const [i, field] of fields.entries()) {
    const ref = fileRef(data[field]);
    if (!ref) continue;
    try {
      const res = await fetchImpl(ref.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_PHOTO_BYTES || total + buf.byteLength > MAX_TOTAL_BYTES) throw new Error("Foto demasiado grande para adjuntar");
      total += buf.byteLength;
      const type = ref.type || res.headers.get("content-type") || "image/jpeg";
      attachments.push({ filename: ref.filename || `${prefix}-foto-${i + 1}.jpg`, content: buf, contentType: type });
    } catch (err) {
      deps.log?.(`No se pudo descargar ${field}; se envía el enlace`, err);
      links.push(ref.url);
    }
  }
  return { attachments, links };
}

function formNameOf(data: Record<string, unknown>) {
  return str(data.formulario || data["form-name"] || data.form_name);
}

function genericEmail(form: string, data: Record<string, unknown>, when: string): EmailMessage {
  const items = Object.entries(data)
    .filter(([k, v]) => typeof v === "string" && v && !["datos_json", "bot-field", "form-name"].includes(k))
    .map(([k, v]) => ({ label: k, value: String(v) }));
  const body = [hero({ kicker: "Nuevo envío", title: esc(form || "Formulario"), subtitle: `Recibido el ${esc(when)}` }), section("Datos", rows(items))].join("");
  return {
    subject: `Nuevo envío del formulario ${form || "web"}`,
    html: shell({ preheader: `Nuevo envío: ${form}`, label: "Formulario", body, footer: "Envío recibido desde la web." }),
    text: items.map((i) => `${i.label}: ${i.value}`).join("\n"),
    attachments: [],
  };
}

/** Guarda la opinión si el cliente autorizó publicarla. Devuelve el enlace para ocultarla. */
async function publishReview(payload: unknown, deps: HandlerDeps, now: Date, log: (m: string, e?: unknown) => void) {
  if (!deps.reviews) return null;
  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success || !canPublish(parsed.data)) return null;
  try {
    const review = toPublicReview(parsed.data, newReviewId(), now);
    await deps.reviews.store.save(review);
    let hideUrl: string | undefined;
    if (deps.reviews.siteUrl) {
      const secret = await deps.reviews.store.secret();
      hideUrl = moderationUrl(deps.reviews.siteUrl, review.id, "ocultar", await signAction(secret, review.id, "ocultar"));
    }
    return { review, hideUrl };
  } catch (err) {
    log("No se pudo guardar la opinión pública", err);
    return null;
  }
}

export async function handleFormSubmission(data: Record<string, unknown>, deps: HandlerDeps): Promise<HandlerResult> {
  const form = formNameOf(data);
  const log = deps.log ?? ((m: string, e?: unknown) => console.error(`[formularios] ${m}`, e ?? ""));
  if (str(data["bot-field"])) return { form, sent: [], skipped: "spam" };

  const now = deps.now?.() ?? new Date();
  const when = madrid(now);
  const payload = parseJson(data.datos_json);
  // La opinión se publica aunque el email todavía no esté configurado.
  const published = form === "valoracion" ? await publishReview(payload, deps, now, log) : null;

  if (!deps.smtp || !deps.notifyTo.length) {
    log("SMTP o NOTIFY_EMAIL_TO sin configurar: no se envían emails visuales (Netlify sigue guardando el envío).");
    return { form, sent: [], skipped: "not_configured", published: !!published };
  }
  const smtp = deps.smtp;
  const sent: string[] = [];
  const send = async (message: EmailMessage, to: string[], tag: string) => {
    try {
      await sendMail(smtp, message, to);
      sent.push(tag);
    } catch (err) {
      log(`Fallo enviando el email «${tag}»`, err);
      if (tag === "empresa") throw err; // Netlify registra el fallo de la función
    }
  };

  if (form === "solicitud-presupuesto") {
    const parsed = budgetRequestSchema.safeParse(payload);
    if (!parsed.success) {
      log("datos_json no válido en la solicitud; se envía el resumen genérico", parsed.error.issues.slice(0, 3));
      await send(genericEmail(form, data, when), deps.notifyTo, "empresa");
      return { form, sent };
    }
    const request = parsed.data;
    const record = {
      reference: str(data.referencia) || "ER-SIN-REF",
      receivedAtMadrid: when,
      zone: serviceZone(request.location),
      request,
    };
    const photos = await collectPhotos(data, ["foto_1", "foto_2", "foto_3", "foto_4", "foto_5", "foto_6"], record.reference, deps);
    await send(buildBudgetNotification(record, photos.attachments, photos.links, now), deps.notifyTo, "empresa");
    if (deps.confirmClient) await send(buildBudgetConfirmation(record), [request.contact.email], "cliente");
    return { form, sent };
  }

  if (form === "valoracion") {
    const parsed = feedbackSchema.safeParse(payload);
    if (!parsed.success) {
      await send(genericEmail(form, data, when), deps.notifyTo, "empresa");
      return { form, sent };
    }
    const f = parsed.data;
    await send(buildFeedbackNotification(f, when, published ? { hideUrl: published.hideUrl } : undefined), deps.notifyTo, "empresa");
    if (deps.confirmClient && f.email) await send(buildFeedbackThanks(f), [f.email], "cliente");
    return { form, sent, published: !!published };
  }

  if (form === "posventa") {
    const parsed = aftercareSchema.safeParse(payload);
    if (!parsed.success) {
      await send(genericEmail(form, data, when), deps.notifyTo, "empresa");
      return { form, sent };
    }
    const a = parsed.data;
    const photos = await collectPhotos(data, ["foto_1", "foto_2", "foto_3"], "posventa", deps);
    await send(buildAftercareNotification(a, when, photos.attachments, photos.links, now), deps.notifyTo, "empresa");
    if (deps.confirmClient && a.email) await send(buildAftercareConfirmation(a), [a.email], "cliente");
    return { form, sent };
  }

  await send(genericEmail(form, data, when), deps.notifyTo, "empresa");
  return { form, sent };
}
