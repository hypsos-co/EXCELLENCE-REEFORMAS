import { absoluteUrl, hasWhatsApp, siteConfig } from "@/config/site";
import { normalizePhone, type BudgetRequest } from "@/lib/budget/schema";
import { budgetText, detailRows, locationText, propertyText, reformTitle, timingText } from "@/lib/budget/summary";
import { buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import { AFTERCARE_KINDS, AFTERCARE_URGENCY, type Aftercare } from "@/lib/forms/aftercare";
import { FEEDBACK_CARE, FEEDBACK_HIGHLIGHTS, FEEDBACK_STAGES, RATING_LABELS, needsAttention, type Feedback } from "@/lib/forms/feedback";
import { labelOf } from "@/lib/budget/options";
import { banner, bullets, button, buttons, draft, esc, hero, note, paragraph, photoGrid, quote, rows, section, shell, stars, steps, tiles } from "./layout";
import { budgetCalendar, budgetReplyTexts, calendarUrl, leadPriority, mailtoUrl, mapsUrl, pendingQuestions, whatsAppWithText } from "./sales";

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

function showroomButton() {
  const url = absoluteUrl("/showroom");
  return url ? button(url, "Ver trabajos reales", "soft") : "";
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

/**
 * Email para Excellence Reformas: una ficha comercial del cliente, ordenada y
 * con todo a un clic (llamar, WhatsApp ya redactado, agendar visita y seguimiento).
 */
export function buildBudgetNotification(record: BudgetRecord, photos: Attachment[], photoLinks: string[] = [], now = new Date()): EmailMessage {
  const r = record.request;
  const title = reformTitle(r);
  const who = r.contact.name.trim();
  const locality = r.location.locality.trim();
  const inline = photos.map((p, i) => ({ ...p, cid: p.cid ?? `foto${i + 1}@excellence` }));
  const photoCount = inline.length + photoLinks.length;
  const prio = leadPriority(r, photoCount, record.zone);
  const pending = pendingQuestions(r, photoCount, record.zone);
  const texts = budgetReplyTexts(r, record.reference);
  const cal = budgetCalendar(r, record.reference, now);
  const wa = whatsAppWithText(r.contact.phone, texts.whatsapp);
  const subject = `${prio.level === "alta" ? "🔥 " : ""}Nuevo cliente: ${who} · ${title} en ${locality} · ${record.reference}`;
  const showroom = absoluteUrl("/showroom");
  const reviewUrl = absoluteUrl("/valoracion");

  const body = [
    hero({
      kicker: `Nueva solicitud de presupuesto · Ref. ${esc(record.reference)}`,
      title: `${esc(who)}<br><span style="font-weight:400;">${esc(title)} en ${esc(locality)}</span>`,
      subtitle: `Recibida el ${esc(record.receivedAtMadrid)}`,
    }),
    banner(
      prio.label,
      prio.reasons.length ? `${prio.reasons.join(" · ")}.` : "",
      prio.level === "alta" ? "good" : prio.level === "media" ? "warn" : "info",
    ),
    buttons([
      button(`tel:${normalizePhone(r.contact.phone)}`, `📞 Llamar a ${firstName(who) || "cliente"}`),
      wa ? button(wa, "WhatsApp con mensaje listo", "whatsapp") : "",
      button(mailtoUrl(r.contact.email, texts.emailSubject, texts.emailBody), "✉️ Responder por email", "soft"),
    ]),
    buttons([
      button(cal.visit, "📅 Agendar visita", "soft"),
      button(cal.followUp, "⏰ Recordarme el seguimiento", "soft"),
      button(mapsUrl(locationText(r)), "📍 Ver en el mapa", "soft"),
    ]),
    tiles([
      { label: "Reforma", value: title },
      { label: "Inmueble", value: propertyText(r) },
      { label: "¿Cuándo quiere empezar?", value: timingText(r), tone: r.planning.timing === "asap" || r.planning.timing === "menos-1-mes" ? ("good" as const) : undefined },
      { label: "Presupuesto orientativo", value: budgetText(r) },
      record.zone === "fuera"
        ? { label: "Zona", value: "Fuera de la zona habitual", tone: "warn" as const }
        : { label: "Zona", value: `${locality} · zona habitual` },
      { label: "Fotos", value: photoCount ? `${photoCount} ${photoCount === 1 ? "foto" : "fotos"}` : "Sin fotos", tone: photoCount ? undefined : ("warn" as const) },
    ]),
    section("Lo que nos cuenta", r.description ? quote(r.description) : note("No ha añadido descripción: pregúntale qué le gustaría conseguir.")),
    section("Proyecto", rows([{ label: "Tipo de reforma", value: title }, ...detailRows(r), { label: "Localidad", value: locationText(r) }])),
    section(
      `Fotografías (${photoCount})`,
      photoCount
        ? photoGrid(inline.map((p) => p.cid!)) + (photoLinks.length ? rows(photoLinks.map((u, i) => ({ label: `Foto ${inline.length + i + 1}`, value: u }))) : "")
        : note("No ha adjuntado fotos. Pídeselas por WhatsApp antes de la visita: ahorra viajes.", "warn"),
    ),
    pending.length ? section("Para preguntar en la llamada", bullets(pending)) : "",
    section(
      "Ficha del cliente",
      rows([
        { label: "Nombre", value: who },
        { label: "Teléfono", value: r.contact.phone },
        { label: "Email", value: r.contact.email },
        { label: "Referencia", value: record.reference },
      ]),
    ),
    section("Mensaje de WhatsApp ya redactado", draft(texts.whatsapp) + note("El botón verde lo abre ya escrito en WhatsApp: revísalo y envíalo.")),
    section(
      "De solicitud a cliente fiel",
      steps([
        { title: "Responde hoy", text: "Una respuesta rápida transmite seriedad: es cuando el cliente está pensando en su reforma." },
        {
          title: "Visita y escucha",
          text: `Confirma medidas, estado y gustos. ${showroom ? "Enséñale trabajos parecidos del showroom." : "Lleva fotos de trabajos parecidos."}`,
        },
        { title: "Presupuesto claro", text: "Por partidas, con materiales, plazos y forma de pago. Sin sorpresas." },
        { title: "Seguimiento a los 2 días", text: "Usa el botón «Recordarme el seguimiento»: resuelve dudas y pregunta si quiere seguir adelante." },
        {
          title: "Al terminar la obra",
          text: `Envíale el enlace de valoración${reviewUrl ? ` (${reviewUrl})` : ""} y del área de clientes: así vuelve y te recomienda.`,
        },
      ]),
    ),
    section("Nota", note(`El presupuesto orientativo lo indica el cliente como referencia de sus expectativas; no es un precio. Aceptó la política de privacidad (versión ${r.consent.policyVersion}).`)),
    `<tr><td style="padding:12px 0 0;"></td></tr>`,
  ].join("");

  const text = [
    `NUEVO CLIENTE ${record.reference} · ${who} · ${title} en ${locality}`,
    `Recibida el ${record.receivedAtMadrid}`,
    `${prio.label}${prio.reasons.length ? ` (${prio.reasons.join(", ")})` : ""}`,
    "",
    `Teléfono: ${r.contact.phone} · Email: ${r.contact.email}`,
    `Inmueble: ${propertyText(r)}`,
    ...detailRows(r).map((x) => `${x.label}: ${x.value}`),
    `Localidad: ${locationText(r)}${record.zone === "fuera" ? " (fuera de la zona habitual)" : ""}`,
    `Fecha prevista: ${timingText(r)}`,
    `Presupuesto orientativo: ${budgetText(r)}`,
    `Descripción: ${r.description ?? "—"}`,
    `Fotos: ${photoCount}`,
    ...(pending.length ? ["", "Para preguntar:", ...pending.map((q) => `- ${q}`)] : []),
    "",
    wa ? `WhatsApp con mensaje listo: ${wa}` : "",
    `Agendar visita: ${cal.visit}`,
  ].join("\n");

  return {
    subject,
    html: shell({
      preheader: `${prio.label} · ${who} · ${title} · ${locality}`,
      label: "Nuevo cliente",
      body,
      footer: `Solicitud ${esc(record.reference)}${record.id ? ` · id ${esc(record.id)}` : ""}. Responde a este email para escribir directamente al cliente.`,
    }),
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
    buttons([businessWhatsAppButton(waText), showroomButton(), areaButton()]),
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

export function buildFeedbackNotification(f: Feedback, receivedAtMadrid: string, published?: { hideUrl?: string }): EmailMessage {
  const alert = needsAttention(f);
  const highlights = f.highlights.map((h) => labelOf(FEEDBACK_HIGHLIGHTS, h)).join(", ");
  const who = f.name ?? "Cliente sin nombre";
  const name = f.name ? firstName(f.name) : "";
  const greeting = `Hola${name ? ` ${name}` : ""}, soy ${siteConfig.owner}, de ${siteConfig.name}.`;
  const replyText = alert
    ? `${greeting}\n\nHe leído tu valoración y te agradezco mucho que nos lo cuentes. Quiero que todo quede como esperas: ¿cuándo te viene bien que hablemos?`
    : `${greeting}\n\n¡Muchas gracias por tu valoración! Nos alegra mucho que estés contento.${
        siteConfig.social.googleReviews ? `\n\nSi te apetece, nos ayudaría muchísimo una reseña en Google: ${siteConfig.social.googleReviews}` : ""
      }\n\nY si conoces a alguien que esté pensando en reformar, estaremos encantados de ayudarle.`;
  const wa = f.phone ? whatsAppWithText(f.phone, replyText) : null;
  const mail = f.email ? mailtoUrl(f.email, `Gracias por tu valoración · ${siteConfig.name}`, `${replyText}\n\nUn saludo,\n${siteConfig.owner}`) : null;
  const call = alert
    ? calendarUrl({
        title: `Llamar a ${who} (valoración ${f.rating}/5)`,
        details: [`Valoración: ${f.rating}/5`, f.comment ? `Comentario: ${f.comment}` : "", f.phone ? `Teléfono: ${f.phone}` : "", f.email ? `Email: ${f.email}` : ""].filter(Boolean).join("\n"),
        inDays: 0,
        hour: 18,
      })
    : null;

  const body = [
    hero({
      kicker: alert ? "⚠️ Requiere atención" : "Nueva valoración",
      title: `${stars(f.rating)}<br>${esc(who)} · ${f.rating}/5 · ${esc(RATING_LABELS[f.rating])}`,
      subtitle: `Recibida el ${esc(receivedAtMadrid)}`,
    }),
    alert
      ? banner(
          f.callback ? "Pide que le contactéis" : "Cliente que necesita atención",
          f.callback ? "Escríbele o llámale hoy: una respuesta rápida convierte una queja en confianza." : "Valoración baja o no se siente bien atendido. Contacta hoy para entender qué ha pasado.",
          "alert",
        )
      : banner("Cliente contento: buen momento para fidelizar", "Agradécele y pídele una reseña o que te recomiende. Los clientes contentos son tu mejor publicidad.", "good"),
    buttons([
      f.phone ? button(`tel:${normalizePhone(f.phone)}`, `📞 Llamar a ${name || "cliente"}`) : "",
      wa ? button(wa, alert ? "WhatsApp: mensaje de disculpa listo" : "WhatsApp: agradecer y pedir reseña", "whatsapp") : "",
      mail ? button(mail, "✉️ Responder por email", "soft") : "",
      call ? button(call, "⏰ Recordarme llamarle hoy", "soft") : "",
    ]),
    tiles([
      { label: "Puntuación", value: `${f.rating} de 5`, tone: f.rating >= 4 ? "good" : f.rating <= 2 ? "alert" : "warn" },
      { label: "¿Bien atendido?", value: labelOf(FEEDBACK_CARE, f.care) || "Sin indicar", tone: f.care === "no" ? "alert" : f.care === "regular" ? "warn" : f.care === "si" ? "good" : undefined },
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
    (wa || mail) ? section("Mensaje ya redactado", draft(replyText)) : "",
    published
      ? section(
          "Publicada en la web",
          note("Esta opinión ya aparece en la portada de la web (con su nombre e inicial), porque el cliente lo ha autorizado.", "good") +
            (published.hideUrl
              ? `<p style="margin:12px 0 0;">${button(published.hideUrl, "Ocultar de la web", "soft")}</p>` +
                note("Úsalo solo si contiene spam, insultos o datos personales. Ocultar opiniones reales solo por ser negativas puede considerarse publicidad engañosa.")
              : ""),
        )
      : "",
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
      published ? `Publicada en la web.${published.hideUrl ? ` Ocultar: ${published.hideUrl}` : ""}` : "",
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

export function buildAftercareNotification(a: Aftercare, receivedAtMadrid: string, photos: Attachment[], photoLinks: string[] = [], now = new Date()): EmailMessage {
  const inline = photos.map((p, i) => ({ ...p, cid: p.cid ?? `posventa${i + 1}@excellence` }));
  const kind = labelOf(AFTERCARE_KINDS, a.kind);
  const urgency = labelOf(AFTERCARE_URGENCY, a.urgency);
  const name = firstName(a.name);
  const replyText = `Hola${name ? ` ${name}` : ""}, soy ${siteConfig.owner}, de ${siteConfig.name}.\n\nHe recibido tu aviso (${kind.toLowerCase()}). Gracias por contármelo. ¿Qué día y hora te vienen bien para que pase a verlo?`;
  const wa = whatsAppWithText(a.phone, replyText);
  const visit = calendarUrl({
    title: `Posventa · ${kind} · ${a.name.trim()}`,
    details: [`Cliente: ${a.name}`, `Teléfono: ${a.phone}`, a.email ? `Email: ${a.email}` : "", a.reference ? `Ref.: ${a.reference}` : "", "", a.description].filter(Boolean).join("\n"),
    location: a.locality,
    minutes: 60,
    now,
  });
  const body = [
    hero({ kicker: "Área de clientes · Posventa", title: `${esc(kind)} · ${esc(a.name)}`, subtitle: `Recibida el ${esc(receivedAtMadrid)}` }),
    banner(
      a.urgency === "urgente" ? "Urgente: contactar hoy" : a.urgency === "pronto" ? "Contactar en 24 h" : "Contactar esta semana",
      "Resolver rápido una posventa es lo que más fideliza: el cliente vuelve y te recomienda.",
      a.urgency === "urgente" ? "alert" : a.urgency === "pronto" ? "warn" : "info",
    ),
    buttons([
      button(`tel:${normalizePhone(a.phone)}`, `📞 Llamar a ${name || "cliente"}`),
      wa ? button(wa, "WhatsApp con mensaje listo", "whatsapp") : "",
      a.email ? button(mailtoUrl(a.email, `Tu consulta · ${siteConfig.name}`, `${replyText}\n\nUn saludo,\n${siteConfig.owner}`), "✉️ Responder por email", "soft") : "",
      button(visit, "📅 Agendar revisión", "soft"),
    ]),
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
    section("Mensaje ya redactado", draft(replyText)),
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
