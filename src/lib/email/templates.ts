import { absoluteUrl, hasWhatsApp, siteConfig } from "@/config/site";
import { normalizePhone, type BudgetRequest } from "@/lib/budget/schema";
import { budgetText, detailRows, locationText, propertyText, reformTitle, timingText } from "@/lib/budget/summary";
import { buildWhatsAppUrl, clientWhatsAppUrl } from "@/lib/budget/whatsapp";
import { AFTERCARE_KINDS, AFTERCARE_URGENCY, type Aftercare } from "@/lib/forms/aftercare";
import { FEEDBACK_CARE, FEEDBACK_HIGHLIGHTS, FEEDBACK_STAGES, RATING_LABELS, needsAttention, type Feedback } from "@/lib/forms/feedback";
import { labelOf } from "@/lib/budget/options";
import { button, buttons, esc, hero, note, paragraph, photoGrid, quote, rows, section, shell, stars, steps, tiles } from "./layout";

export type Attachment = { filename: string; content: Uint8Array; contentType: string; cid?: string };

export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments: Attachment[];
};

/* ------------------------------ Utilidades ------------------------------- */

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

function contactButtons(name: string, phone?: string, email?: string, subject?: string) {
  const items: string[] = [];
  if (phone) items.push(button(`tel:${normalizePhone(phone)}`, `Llamar a ${firstName(name) || "cliente"}`));
  const wa = phone ? clientWhatsAppUrl(phone) : null;
  if (wa) items.push(button(wa, "Abrir WhatsApp", "whatsapp"));
  if (email) items.push(button(`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`, "Responder por email", "soft"));
  return buttons(items);
}

/** Pie con redes y aviso para los emails que recibe el cliente. */
function clientFooter() {
  const links = [
    siteConfig.social.instagram && `<a href="${esc(siteConfig.social.instagram)}" style="color:#102B49;font-weight:700;">Instagram</a>`,
    siteConfig.social.facebook && `<a href="${esc(siteConfig.social.facebook)}" style="color:#102B49;font-weight:700;">Facebook</a>`,
    siteConfig.social.tiktok && `<a href="${esc(siteConfig.social.tiktok)}" style="color:#102B49;font-weight:700;">TikTok</a>`,
    siteConfig.social.youtube && `<a href="${esc(siteConfig.social.youtube)}" style="color:#102B49;font-weight:700;">YouTube</a>`,
  ].filter(Boolean);
  const privacy = absoluteUrl("/politica-de-privacidad");
  return [
    links.length ? `Síguenos: ${links.join(" · ")}<br>` : "",
    "Has recibido este email porque has contactado con Excellence Reformas a través de su web.",
    privacy ? ` <a href="${esc(privacy)}" style="color:#486684;">Política de privacidad</a>.` : "",
  ].join("");
}

function businessWhatsAppButton(text: string, label = "Escribir a Julio César por WhatsApp") {
  if (!hasWhatsApp()) return "";
  const url = buildWhatsAppUrl(siteConfig.contact.whatsapp, text);
  return url ? button(url, label, "whatsapp") : "";
}

function areaButton() {
  const url = absoluteUrl("/clientes");
  return url ? button(url, "Tu área de cliente", "soft") : "";
}

/* ------------------------- Solicitud de presupuesto ----------------------- */

export type BudgetRecord = {
  id?: string;
  reference: string;
  receivedAtMadrid: string;
  zone: "habitual" | "fuera";
  request: BudgetRequest;
};

/** Email para Excellence Reformas: visual, ordenado y con las fotos incrustadas. */
export function buildBudgetNotification(record: BudgetRecord, photos: Attachment[], photoLinks: string[] = []): EmailMessage {
  const r = record.request;
  const title = reformTitle(r);
  const subject = `Nueva solicitud de presupuesto · ${title} · ${r.location.locality} · ${record.reference}`;
  const inline = photos.map((p, i) => ({ ...p, cid: p.cid ?? `foto${i + 1}@excellence` }));

  const body = [
    hero({
      kicker: `Nueva solicitud · Ref. ${esc(record.reference)}`,
      title: `${esc(title)} en ${esc(r.location.locality)}`,
      subtitle: `Recibida el ${esc(record.receivedAtMadrid)}`,
    }),
    contactButtons(r.contact.name, r.contact.phone, r.contact.email, `Tu solicitud ${record.reference} · ${siteConfig.name}`),
    tiles([
      { label: "Inmueble", value: propertyText(r) },
      { label: "Fecha prevista", value: timingText(r) },
      { label: "Presupuesto orientativo", value: budgetText(r) },
      record.zone === "fuera"
        ? { label: "Zona", value: "Fuera de la zona habitual", tone: "warn" as const }
        : { label: "Zona", value: siteConfig.serviceArea.label },
    ]),
    section("Proyecto", rows([{ label: "Tipo de reforma", value: title }, ...detailRows(r)])),
    section(
      "Ubicación",
      rows([{ label: "Localidad", value: locationText(r) }]) +
        (record.zone === "fuera" ? note(`Localidad fuera de la zona habitual (${siteConfig.serviceArea.label}). Valorar si se atiende.`, "warn") : ""),
    ),
    section("Lo que nos cuenta", r.description ? quote(r.description) : note("El cliente no ha añadido descripción.")),
    section(
      `Fotografías (${inline.length + photoLinks.length})`,
      inline.length || photoLinks.length
        ? photoGrid(inline.map((p) => p.cid!)) +
            (photoLinks.length ? rows(photoLinks.map((u, i) => ({ label: `Foto ${inline.length + i + 1}`, value: u }))) : "")
        : note("El cliente no ha adjuntado fotografías."),
    ),
    section(
      "Contacto",
      rows([
        { label: "Nombre", value: r.contact.name },
        { label: "Teléfono", value: r.contact.phone },
        { label: "Email", value: r.contact.email },
      ]),
    ),
    section(
      "Nota",
      note("El presupuesto orientativo lo indica el cliente como referencia de sus expectativas; no es un precio. Aceptó la política de privacidad (versión " + r.consent.policyVersion + ")."),
    ),
    `<tr><td style="padding:12px 0 0;"></td></tr>`,
  ].join("");

  const text = [
    `NUEVA SOLICITUD ${record.reference} · ${title} en ${r.location.locality}`,
    `Recibida el ${record.receivedAtMadrid}`,
    "",
    `Inmueble: ${propertyText(r)}`,
    ...detailRows(r).map((x) => `${x.label}: ${x.value}`),
    `Localidad: ${locationText(r)}${record.zone === "fuera" ? " (fuera de la zona habitual)" : ""}`,
    `Fecha prevista: ${timingText(r)}`,
    `Presupuesto orientativo: ${budgetText(r)}`,
    `Descripción: ${r.description ?? "—"}`,
    `Fotos: ${inline.length + photoLinks.length}`,
    "",
    `Contacto: ${r.contact.name} · ${r.contact.phone} · ${r.contact.email}`,
  ].join("\n");

  return {
    subject,
    html: shell({ preheader: `${r.contact.name} · ${title} · ${r.location.locality}`, label: "Smart Budget", body, footer: `Solicitud ${esc(record.reference)}${record.id ? ` · id ${esc(record.id)}` : ""}.` }),
    text,
    replyTo: r.contact.email,
    attachments: inline,
  };
}

/** Confirmación para el cliente: le da tranquilidad y un canal directo. */
export function buildBudgetConfirmation(record: BudgetRecord): EmailMessage {
  const r = record.request;
  const name = firstName(r.contact.name);
  const title = reformTitle(r);
  const waText = `Hola Julio César, soy ${r.contact.name.trim()}. Os escribo por mi solicitud ${record.reference} (${title} en ${r.location.locality}).`;
  const body = [
    hero({
      kicker: `Solicitud recibida · Ref. ${esc(record.reference)}`,
      title: `¡Gracias${name ? `, ${esc(name)}` : ""}! Tu proyecto ya está en nuestras manos.`,
      subtitle: "Hemos recibido tu solicitud de presupuesto correctamente.",
    }),
    section(
      "¿Qué pasa ahora?",
      steps([
        { title: `${siteConfig.owner} revisará tu proyecto`, text: "Leeremos tus respuestas y miraremos tus fotos con atención." },
        { title: "Hablaremos contigo", text: "Te contactaremos por teléfono o WhatsApp para resolver dudas y concretar detalles." },
        { title: "Tu presupuesto personalizado", text: "Preparado para tu proyecto. Nunca un precio automático." },
      ]),
    ),
    section(
      "Tu solicitud",
      rows([
        { label: "Tipo de reforma", value: title },
        { label: "Inmueble", value: propertyText(r) },
        { label: "Localidad", value: locationText(r) },
        { label: "Fecha prevista", value: timingText(r) },
      ]),
    ),
    buttons([businessWhatsAppButton(waText), areaButton()]),
    paragraph(`Si quieres añadir algo, responde a este email o escríbenos indicando tu referencia <strong>${esc(record.reference)}</strong>.`),
    paragraph(`Un saludo,<br><strong>${esc(siteConfig.owner)}</strong><br>${esc(siteConfig.name)}`),
    `<tr><td style="padding:14px 0 0;"></td></tr>`,
  ].join("");
  return {
    subject: `Hemos recibido tu solicitud ${record.reference} · ${siteConfig.name}`,
    html: shell({ preheader: "Tu solicitud de presupuesto está en buenas manos.", label: "Tu solicitud", body, footer: clientFooter() }),
    text: [
      `¡Gracias${name ? `, ${name}` : ""}! Hemos recibido tu solicitud ${record.reference}.`,
      `${siteConfig.owner} revisará tu proyecto y te contactaremos por teléfono o WhatsApp.`,
      "",
      `Tipo de reforma: ${title}`,
      `Localidad: ${locationText(r)}`,
      "",
      `Un saludo, ${siteConfig.owner} · ${siteConfig.name}`,
    ].join("\n"),
    attachments: [],
  };
}

/* -------------------------------- Valoración ------------------------------ */

export function buildFeedbackNotification(f: Feedback, receivedAtMadrid: string): EmailMessage {
  const alert = needsAttention(f);
  const highlights = f.highlights.map((h) => labelOf(FEEDBACK_HIGHLIGHTS, h)).join(", ");
  const who = f.name ?? "Cliente sin nombre";
  const body = [
    hero({
      kicker: alert ? "⚠️ Requiere atención" : "Nueva valoración",
      title: `${stars(f.rating)}<br>${esc(who)} · ${f.rating}/5 · ${esc(RATING_LABELS[f.rating])}`,
      subtitle: `Recibida el ${esc(receivedAtMadrid)}`,
    }),
    alert
      ? `<tr><td style="padding:10px 28px 0;">${note(
          f.callback
            ? "El cliente pide que le contactéis. Escribidle o llamadle cuanto antes."
            : "Valoración baja o cliente que no se siente bien atendido. Conviene contactar cuanto antes.",
          "alert",
        )}</td></tr>`
      : "",
    contactButtons(who, f.phone, f.email, `Gracias por tu valoración · ${siteConfig.name}`),
    tiles([
      { label: "Puntuación", value: `${f.rating} de 5` },
      { label: "¿Bien atendido?", value: labelOf(FEEDBACK_CARE, f.care) || "Sin indicar", tone: f.care === "no" ? "alert" : f.care === "regular" ? "warn" : undefined },
      { label: "Fase", value: labelOf(FEEDBACK_STAGES, f.stage) || "Sin indicar" },
      { label: "¿Quiere que le llamen?", value: f.callback ? "Sí" : "No", tone: f.callback ? "warn" : undefined },
    ]),
    section("Comentario", f.comment ? quote(f.comment) : note("Sin comentario.")),
    section(
      "Detalles",
      rows([
        { label: "Lo que destaca", value: highlights || "—" },
        { label: "Referencia", value: f.reference ?? "—" },
        { label: "Nombre", value: f.name ?? "—" },
        { label: "Teléfono", value: f.phone ?? "—" },
        { label: "Email", value: f.email ?? "—" },
        { label: "¿Se puede publicar?", value: f.publish ? "Sí, autoriza publicarla con su nombre e inicial" : "No" },
      ]),
    ),
    `<tr><td style="padding:12px 0 0;"></td></tr>`,
  ].join("");
  return {
    subject: `${alert ? "⚠️ " : ""}Valoración ${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)} (${f.rating}/5) · ${who}`,
    html: shell({ preheader: `${who}: ${f.rating}/5${f.comment ? ` · ${f.comment.slice(0, 80)}` : ""}`, label: "Valoración", body, footer: "Valoración enviada desde la web de Excellence Reformas." }),
    text: [
      `VALORACIÓN ${f.rating}/5 (${RATING_LABELS[f.rating]})${alert ? " · REQUIERE ATENCIÓN" : ""}`,
      `¿Bien atendido?: ${labelOf(FEEDBACK_CARE, f.care) || "—"} · Fase: ${labelOf(FEEDBACK_STAGES, f.stage) || "—"}`,
      `Comentario: ${f.comment ?? "—"}`,
      `Contacto: ${who} · ${f.phone ?? "—"} · ${f.email ?? "—"} · Quiere llamada: ${f.callback ? "sí" : "no"}`,
    ].join("\n"),
    replyTo: f.email,
    attachments: [],
  };
}

export function buildFeedbackThanks(f: Feedback): EmailMessage {
  const name = f.name ? firstName(f.name) : "";
  const good = !needsAttention(f);
  const body = [
    hero({
      kicker: "Gracias por tu opinión",
      title: good ? `¡Gracias${name ? `, ${esc(name)}` : ""}! Nos alegra que estés contento.` : `Gracias${name ? `, ${esc(name)}` : ""}. Queremos ayudarte.`,
      subtitle: good
        ? "Tu valoración nos ayuda a seguir cuidando cada detalle."
        : `${esc(siteConfig.owner)} ha recibido tu mensaje y quiere que todo vaya bien.`,
    }),
    `<tr><td style="padding:16px 28px 0;">${stars(f.rating)}</td></tr>`,
    buttons([
      businessWhatsAppButton(`Hola Julio César, soy ${f.name ?? "un cliente"}. Os escribo por mi valoración.`, good ? "Escríbenos por WhatsApp" : "Hablar ahora con Julio César"),
      siteConfig.social.googleReviews ? button(siteConfig.social.googleReviews, "Déjanos tu reseña en Google", "soft") : "",
      siteConfig.social.instagram ? button(siteConfig.social.instagram, "Síguenos en Instagram", "soft") : "",
    ]),
    paragraph(`Un saludo,<br><strong>${esc(siteConfig.owner)}</strong><br>${esc(siteConfig.name)}`),
    `<tr><td style="padding:14px 0 0;"></td></tr>`,
  ].join("");
  return {
    subject: `Gracias por tu valoración · ${siteConfig.name}`,
    html: shell({ preheader: "Gracias por contarnos cómo va todo.", label: "Tu opinión", body, footer: clientFooter() }),
    text: `Gracias por tu valoración (${f.rating}/5). Un saludo, ${siteConfig.owner} · ${siteConfig.name}`,
    attachments: [],
  };
}

/* --------------------------------- Posventa ------------------------------- */

export function buildAftercareNotification(a: Aftercare, receivedAtMadrid: string, photos: Attachment[], photoLinks: string[] = []): EmailMessage {
  const inline = photos.map((p, i) => ({ ...p, cid: p.cid ?? `posventa${i + 1}@excellence` }));
  const kind = labelOf(AFTERCARE_KINDS, a.kind);
  const urgency = labelOf(AFTERCARE_URGENCY, a.urgency);
  const body = [
    hero({ kicker: "Área de clientes · Posventa", title: `${esc(kind)} · ${esc(a.name)}`, subtitle: `Recibida el ${esc(receivedAtMadrid)}` }),
    contactButtons(a.name, a.phone, a.email, `Tu consulta · ${siteConfig.name}`),
    tiles([
      { label: "Qué necesita", value: kind },
      { label: "Urgencia", value: urgency, tone: a.urgency === "urgente" ? "alert" : a.urgency === "pronto" ? "warn" : undefined },
      { label: "Localidad", value: a.locality ?? "Sin indicar" },
      { label: "Referencia", value: a.reference ?? "Sin indicar" },
    ]),
    section("Lo que nos cuenta", quote(a.description)),
    section(
      `Fotografías (${inline.length + photoLinks.length})`,
      inline.length || photoLinks.length
        ? photoGrid(inline.map((p) => p.cid!)) + (photoLinks.length ? rows(photoLinks.map((u, i) => ({ label: `Foto ${inline.length + i + 1}`, value: u }))) : "")
        : note("Sin fotografías."),
    ),
    section("Contacto", rows([{ label: "Nombre", value: a.name }, { label: "Teléfono", value: a.phone }, { label: "Email", value: a.email ?? "—" }])),
    `<tr><td style="padding:12px 0 0;"></td></tr>`,
  ].join("");
  return {
    subject: `${a.urgency === "urgente" ? "URGENTE · " : ""}Posventa · ${kind} · ${a.name}`,
    html: shell({ preheader: `${a.name}: ${a.description.slice(0, 90)}`, label: "Posventa", body, footer: "Solicitud enviada desde el área de clientes de la web." }),
    text: [`POSVENTA · ${kind} · ${urgency}`, `Cliente: ${a.name} · ${a.phone} · ${a.email ?? "—"}`, `Localidad: ${a.locality ?? "—"} · Ref.: ${a.reference ?? "—"}`, "", a.description].join("\n"),
    replyTo: a.email,
    attachments: inline,
  };
}

export function buildAftercareConfirmation(a: Aftercare): EmailMessage {
  const name = firstName(a.name);
  const body = [
    hero({
      kicker: "Área de clientes",
      title: `Hola${name ? `, ${esc(name)}` : ""}. Ya tenemos tu mensaje.`,
      subtitle: `${esc(siteConfig.owner)} lo revisará y se pondrá en contacto contigo.`,
    }),
    section("Lo que nos has contado", quote(a.description)),
    buttons([businessWhatsAppButton(`Hola Julio César, soy ${a.name.trim()}. Os escribo por la consulta que envié desde el área de clientes.`), areaButton()]),
    paragraph(`Gracias por seguir confiando en nosotros.<br><strong>${esc(siteConfig.owner)}</strong><br>${esc(siteConfig.name)}`),
    `<tr><td style="padding:14px 0 0;"></td></tr>`,
  ].join("");
  return {
    subject: `Hemos recibido tu consulta · ${siteConfig.name}`,
    html: shell({ preheader: "Estamos contigo también después de la obra.", label: "Tu consulta", body, footer: clientFooter() }),
    text: `Hola${name ? `, ${name}` : ""}. Hemos recibido tu consulta y te contactaremos. ${siteConfig.owner} · ${siteConfig.name}`,
    attachments: [],
  };
}
