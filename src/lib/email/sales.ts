import { siteConfig } from "@/config/site";
import { DETAIL_QUESTIONS, reformLabel } from "@/lib/budget/options";
import { selectedServices, type BudgetRequest } from "@/lib/budget/schema";
import { locationText, reformTitle } from "@/lib/budget/summary";
import { clientWhatsAppUrl } from "@/lib/budget/whatsapp";

/**
 * Ayudas comerciales para los emails que recibe Julio César: prioridad del
 * contacto, preguntas pendientes, mensajes ya redactados y enlaces de agenda.
 * Todo es orientativo: él decide y puede editar cada mensaje antes de enviarlo.
 */

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/* -------------------------------- Prioridad ------------------------------- */

export type Priority = { level: "alta" | "media" | "normal"; label: string; reasons: string[] };

export function leadPriority(r: BudgetRequest, photos: number, zone: "habitual" | "fuera"): Priority {
  let score = 0;
  const reasons: string[] = [];
  const timing = r.planning.timing;
  if (timing === "asap" || timing === "menos-1-mes") {
    score += 2;
    reasons.push(timing === "asap" ? "quiere empezar lo antes posible" : "quiere empezar en menos de un mes");
  } else if (timing === "1-3-meses") {
    score += 1;
    reasons.push("quiere empezar en 1-3 meses");
  }
  if (photos > 0) {
    score += 1;
    reasons.push(`ha enviado ${photos} ${photos === 1 ? "foto" : "fotos"}`);
  }
  if (r.planning.budget && r.planning.budget !== "valorar") {
    score += 1;
    reasons.push("ha indicado un presupuesto orientativo");
  }
  if ((r.description?.trim().length ?? 0) >= 40) {
    score += 1;
    reasons.push("ha explicado bien lo que quiere");
  }
  if (zone === "fuera") {
    score -= 1;
    reasons.push("está fuera de la zona habitual");
  }
  if (score >= 4) return { level: "alta", label: "Prioridad alta · contactar hoy", reasons };
  if (score >= 2) return { level: "media", label: "Prioridad media · contactar en 24 h", reasons };
  return { level: "normal", label: "Contactar en 24-48 h", reasons };
}

/* --------------------------- Preguntas pendientes ------------------------- */

/** Lo que el cliente no sabía o no indicó: para preguntarlo en la llamada o la visita. */
export function pendingQuestions(r: BudgetRequest, photos: number, zone: "habitual" | "fuera"): string[] {
  const out: string[] = [];
  const services = selectedServices(r.reform);
  for (const s of services) {
    const q = DETAIL_QUESTIONS[s];
    const a = r.details[s];
    const name = reformLabel(s).toLowerCase();
    if (q.size && (!a?.size || a.size === "no-se")) out.push(`Medidas aproximadas (${name}): no las sabía.`);
    if (q.items && !a?.items?.length) out.push(`Qué quiere cambiar exactamente (${name}).`);
  }
  if (!r.planning.timing || r.planning.timing === "valorando") out.push("Para cuándo le gustaría tener la obra hecha.");
  if (!r.planning.budget || r.planning.budget === "valorar") out.push("Qué presupuesto maneja, aunque sea aproximado.");
  if (!photos) out.push("Pedirle fotos del estado actual por WhatsApp antes de la visita.");
  if (!r.description?.trim()) out.push("Qué estilo o acabados le gustan (puedes enseñarle el showroom).");
  if (zone === "fuera") out.push(`Confirmar si os desplazáis a ${r.location.locality.trim()}.`);
  return out;
}

/* ---------------------------- Enlaces de acción --------------------------- */

export function whatsAppWithText(phone: string, text: string): string | null {
  const base = clientWhatsAppUrl(phone);
  return base ? `${base}?text=${encodeURIComponent(text)}` : null;
}

export function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Fecha de Madrid (AAAAMMDD) dentro de `days` días. */
function madridDay(from: Date, days: number): string {
  const d = new Date(from.getTime() + days * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}

/**
 * Evento ya rellenado en Google Calendar. Sin `start` deja la fecha a su
 * elección; con `start` (días desde hoy, a las `hour` de Madrid) lo programa.
 */
export function calendarUrl(o: {
  title: string;
  details: string;
  location?: string;
  inDays?: number;
  hour?: number;
  minutes?: number;
  now?: Date;
}): string {
  const p = new URLSearchParams({ action: "TEMPLATE", text: o.title, details: o.details });
  if (o.location) p.set("location", o.location);
  if (o.inDays !== undefined) {
    const day = madridDay(o.now ?? new Date(), o.inDays);
    const h = o.hour ?? 10;
    const end = h * 60 + (o.minutes ?? 15);
    const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
    p.set("dates", `${day}T${t(h * 60)}/${day}T${t(end)}`);
    p.set("ctz", "Europe/Madrid");
  }
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/* --------------------------- Mensajes redactados -------------------------- */

const signature = () => `${siteConfig.owner}\n${siteConfig.name}`;

export function budgetReplyTexts(r: BudgetRequest, reference: string) {
  const name = firstName(r.contact.name);
  const title = reformTitle(r).toLowerCase();
  const locality = r.location.locality.trim();
  const whatsapp = [
    `Hola${name ? ` ${name}` : ""}, soy ${siteConfig.owner}, de ${siteConfig.name}.`,
    `He recibido tu solicitud (${reference}) para ${title} en ${locality}. ¡Gracias por pensar en nosotros!`,
    "¿Te viene bien que hablemos hoy o mañana? Si quieres, podemos quedar para ver la obra y prepararte un presupuesto a medida.",
  ].join("\n\n");
  const emailSubject = `Tu reforma con ${siteConfig.name} · ${reference}`;
  const emailBody = [
    `Hola${name ? ` ${name}` : ""}:`,
    "",
    `Soy ${siteConfig.owner}, de ${siteConfig.name}. He recibido tu solicitud para ${title} en ${locality} y me gustaría conocer un poco más tu proyecto.`,
    "",
    "¿Qué día y hora te vienen bien para llamarte o pasar a verlo?",
    "",
    "Un saludo,",
    signature(),
  ].join("\n");
  return { whatsapp, emailSubject, emailBody };
}

export function budgetCalendar(r: BudgetRequest, reference: string, now?: Date) {
  const title = reformTitle(r);
  const who = r.contact.name.trim();
  const base = [`Ref. ${reference}`, `Cliente: ${who}`, `Teléfono: ${r.contact.phone}`, `Email: ${r.contact.email}`, `Reforma: ${title}`, `Localidad: ${locationText(r)}`];
  return {
    visit: calendarUrl({ title: `Visita · ${title} · ${who}`, details: [...base, "", "Llevar: metro, muestras y fotos de trabajos similares."].join("\n"), location: locationText(r), minutes: 60 }),
    followUp: calendarUrl({
      title: `Seguimiento · ${who} (${reference})`,
      details: [...base, "", "Llamar o escribir para resolver dudas y saber si quiere seguir adelante."].join("\n"),
      inDays: 2,
      now,
    }),
  };
}
