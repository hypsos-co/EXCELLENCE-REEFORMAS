import { siteConfig } from "@/config/site";
import { UPLOAD_LIMITS } from "./uploads";
import { budgetText, detailRows, locationText, propertyText, reformTitle, timingText, type SummaryDraft } from "./summary";
import { clientWhatsAppUrl } from "./whatsapp";
import { serviceZone } from "./zone";

/**
 * Envío a NETLIFY FORMS (versión HTML estática para Netlify).
 *
 * Netlify detecta el formulario en `public/__forms.html` al desplegar. Los
 * nombres de campo de ese archivo y los de NETLIFY_FIELDS deben coincidir
 * exactamente (hay una prueba que lo comprueba).
 *
 * Orden importante para el panel de Netlify: el primer campo de texto visible
 * es el «título» de cada solicitud (nombre) y el primer textarea, el «cuerpo»
 * (resumen completo).
 */

export const NETLIFY_FORM_NAME = "solicitud-presupuesto";
export const NETLIFY_HONEYPOT = "bot-field";
/** Ruta del esqueleto estático a la que se envía el formulario. */
export const NETLIFY_POST_PATH = "/__forms.html";

export const NETLIFY_PHOTO_FIELDS = Array.from({ length: UPLOAD_LIMITS.maxFiles }, (_, i) => `foto_${i + 1}`);

export const NETLIFY_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "referencia",
  "tipo_reforma",
  "inmueble",
  "localidad",
  "codigo_postal",
  "provincia",
  "zona",
  "fecha_prevista",
  "presupuesto_orientativo",
  "privacidad",
  "enviado_el",
  "resumen",
  "detalles",
  "descripcion",
  "subject",
  ...NETLIFY_PHOTO_FIELDS,
  NETLIFY_HONEYPOT,
] as const;

export type NetlifyDraft = SummaryDraft & {
  description: string;
  contact: { name: string; phone: string; email: string };
  location: { locality: string; province: string; postalCode?: string };
};

function madridNow(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", dateStyle: "full", timeStyle: "short" }).format(date);
}

/** Texto completo y legible de la solicitud (llega en el email de Netlify). */
export function netlifySummary(d: NetlifyDraft, reference: string, photoCount: number): string {
  const zone = serviceZone({ locality: d.location.locality, province: d.location.province });
  const wa = clientWhatsAppUrl(d.contact.phone);
  const lines = [
    `SOLICITUD ${reference}`,
    "",
    `Tipo de reforma: ${reformTitle(d)}`,
    `Inmueble: ${propertyText(d)}`,
    ...detailRows(d).map((r) => `${r.label}: ${r.value}`),
    "",
    `Localidad: ${locationText(d)}${zone === "fuera" ? ` (FUERA de la zona habitual: ${siteConfig.serviceArea.label})` : ""}`,
    `Fecha prevista: ${timingText(d)}`,
    `Presupuesto orientativo: ${budgetText(d)} (lo indica el cliente; no es un precio)`,
    "",
    `Descripción: ${d.description.trim() || "Sin descripción"}`,
    `Fotos adjuntas: ${photoCount}`,
    "",
    `Contacto: ${d.contact.name.trim()} · ${d.contact.phone.trim()} · ${d.contact.email.trim()}`,
    ...(wa ? [`WhatsApp del cliente: ${wa}`] : []),
  ];
  return lines.join("\n");
}

/**
 * Construye el cuerpo multipart para Netlify Forms.
 * Una foto por campo (foto_1 … foto_6), como exige Netlify.
 */
export function buildNetlifyFormData(
  d: NetlifyDraft,
  opts: { reference: string; photos: File[]; honeypot: string; privacyVersion: string; now?: Date },
): FormData {
  const now = opts.now ?? new Date();
  const zone = serviceZone({ locality: d.location.locality, province: d.location.province });
  const title = reformTitle(d);
  const fd = new FormData();
  fd.append("form-name", NETLIFY_FORM_NAME);
  fd.append("nombre", d.contact.name.trim());
  fd.append("telefono", d.contact.phone.trim());
  fd.append("email", d.contact.email.trim());
  fd.append("referencia", opts.reference);
  fd.append("tipo_reforma", title);
  fd.append("inmueble", propertyText(d));
  fd.append("localidad", d.location.locality.trim());
  fd.append("codigo_postal", d.location.postalCode?.trim() ?? "");
  fd.append("provincia", d.location.province);
  fd.append("zona", zone === "habitual" ? "Zona habitual" : "Fuera de la zona habitual");
  fd.append("fecha_prevista", timingText(d));
  fd.append("presupuesto_orientativo", budgetText(d));
  fd.append("privacidad", `Aceptada (versión ${opts.privacyVersion})`);
  fd.append("enviado_el", madridNow(now));
  fd.append("resumen", netlifySummary(d, opts.reference, opts.photos.length));
  fd.append("detalles", detailRows(d).map((r) => `${r.label}: ${r.value}`).join("\n") || "Sin detalles");
  fd.append("descripcion", d.description.trim());
  fd.append("subject", `Nueva solicitud ${opts.reference} · ${title} · ${d.location.locality.trim()}`);
  opts.photos.slice(0, NETLIFY_PHOTO_FIELDS.length).forEach((file, i) => fd.append(NETLIFY_PHOTO_FIELDS[i], file, file.name));
  fd.append(NETLIFY_HONEYPOT, opts.honeypot);
  return fd;
}
