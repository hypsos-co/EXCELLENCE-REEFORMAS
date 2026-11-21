import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { aftercareSchema, AFTERCARE_MAX_PHOTOS } from "@/lib/forms/aftercare";
import { feedbackSchema } from "@/lib/forms/feedback";
import { issuesToFieldErrors } from "@/lib/budget/schema";
import { UPLOAD_LIMITS } from "@/lib/budget/uploads";
import {
  buildAftercareConfirmation,
  buildAftercareNotification,
  buildFeedbackNotification,
  buildFeedbackThanks,
  type Attachment,
  type EmailMessage,
} from "@/lib/email/templates";
import { getServerConfig } from "@/lib/server/env";
import { sendNotification } from "@/lib/server/email";
import { displayName, sniffImage } from "@/lib/server/files";
import { RateLimiter, clientIp } from "@/lib/server/rate-limit";
import { formatMadrid } from "@/lib/server/record";
import { createStorage, putJson } from "@/lib/server/storage";
import { storageReviewStore } from "@/lib/server/reviews";
import { canPublish, moderationUrl, newReviewId, signAction, toPublicReview } from "@/lib/reviews/public";

/**
 * POST /api/formularios (versión con servidor): valoraciones y posventa.
 * En la versión HTML para Netlify estos formularios van a Netlify Forms.
 */

export const maxDuration = 30;
let limiter: RateLimiter | null = null;

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: NextRequest) {
  const cfg = getServerConfig();
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && !cfg.allowedOrigins.includes(origin) && new URL(origin).host !== host) {
    return json(403, { ok: false, message: "Origen no permitido." });
  }
  if (cfg.storage.driver === "unconfigured" || (cfg.requireEmail && cfg.email.mode === "unconfigured")) {
    return json(503, { ok: false, code: "not_configured", message: "Este formulario todavía no está activo." });
  }
  limiter ??= new RateLimiter(cfg.rateLimit.max * 2, cfg.rateLimit.windowMs);
  const rl = limiter.check(clientIp(request.headers));
  if (!rl.ok) return json(429, { ok: false, message: "Has hecho varios envíos seguidos. Espera unos minutos." });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, message: "No hemos podido leer el formulario." });
  }
  if (String(form.get("website") ?? "")) return json(400, { ok: false, message: "No hemos podido validar el envío." });

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("datos_json") ?? ""));
  } catch {
    return json(400, { ok: false, message: "No hemos podido leer el formulario." });
  }

  const storage = createStorage(cfg.storage);
  const email = cfg.email.mode === "unconfigured" ? ({ mode: "preview" } as const) : cfg.email;
  const now = new Date();
  const when = formatMadrid(now);
  const id = randomUUID();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const kind = String(form.get("formulario"));

  const deliver = async (base: string, business: EmailMessage, client: EmailMessage | null, clientEmail?: string) => {
    const res = await sendNotification(email, business);
    if (res.status === "preview") await storage.put(`${base}/email-preview.html`, business.html, "text/html; charset=utf-8");
    if (client && clientEmail && process.env.SEND_CLIENT_CONFIRMATION !== "false") {
      try {
        await sendNotification(email, client, [clientEmail]);
      } catch (err) {
        console.error("[formularios] confirmación al cliente", err);
      }
    }
  };

  try {
    if (kind === "valoracion") {
      const parsed = feedbackSchema.safeParse(raw);
      if (!parsed.success) return json(422, { ok: false, message: "Revisa los datos.", fieldErrors: issuesToFieldErrors(parsed.error.issues) });
      const f = parsed.data;
      const base = `valoraciones/${yyyy}/${mm}/${id}`;
      await putJson(storage, `${base}/valoracion.json`, { id, receivedAt: now.toISOString(), receivedAtMadrid: when, feedback: f });
      // Opinión pública (solo si el cliente lo autoriza): se guarda de forma permanente y aparece en la portada.
      let published: { hideUrl?: string } | undefined;
      if (canPublish(f)) {
        const reviews = storageReviewStore(storage);
        const review = toPublicReview(f, newReviewId(), now);
        await reviews.save(review);
        const origin = new URL(request.url).origin;
        published = { hideUrl: moderationUrl(origin, review.id, "ocultar", await signAction(await reviews.secret(), review.id, "ocultar")) };
      }
      await deliver(base, buildFeedbackNotification(f, when, published), f.email ? buildFeedbackThanks(f) : null, f.email);
      return json(201, { ok: true });
    }
    if (kind === "posventa") {
      const parsed = aftercareSchema.safeParse(raw);
      if (!parsed.success) return json(422, { ok: false, message: "Revisa los datos.", fieldErrors: issuesToFieldErrors(parsed.error.issues) });
      const a = parsed.data;
      const base = `posventa/${yyyy}/${mm}/${id}`;
      const photos: Attachment[] = [];
      let total = 0;
      for (const entry of form.getAll("fotos").slice(0, AFTERCARE_MAX_PHOTOS)) {
        if (typeof entry === "string") continue;
        const bytes = new Uint8Array(await entry.arrayBuffer());
        const kindImg = sniffImage(bytes);
        total += bytes.byteLength;
        if (!kindImg || bytes.byteLength > UPLOAD_LIMITS.maxFileBytes || total > UPLOAD_LIMITS.maxTotalBytes) {
          return json(422, { ok: false, message: `La foto «${displayName(entry.name)}» no es válida o es demasiado pesada.` });
        }
        const key = `${base}/fotos/foto-${photos.length + 1}.${kindImg.ext}`;
        await storage.put(key, bytes, kindImg.mime);
        photos.push({ filename: `posventa-foto-${photos.length + 1}.${kindImg.ext}`, content: bytes, contentType: kindImg.mime });
      }
      await putJson(storage, `${base}/posventa.json`, { id, receivedAt: now.toISOString(), receivedAtMadrid: when, aftercare: a, photos: photos.length });
      await deliver(base, buildAftercareNotification(a, when, photos), a.email ? buildAftercareConfirmation(a) : null, a.email);
      return json(201, { ok: true });
    }
    return json(400, { ok: false, message: "Formulario desconocido." });
  } catch (err) {
    console.error("[formularios]", err);
    return json(500, { ok: false, message: "No hemos podido enviar el formulario. Inténtalo de nuevo en unos minutos." });
  }
}
