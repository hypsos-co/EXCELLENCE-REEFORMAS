import { labelOf } from "@/lib/budget/options";
import { AFTERCARE_KINDS, AFTERCARE_MAX_PHOTOS, AFTERCARE_URGENCY, type Aftercare } from "./aftercare";
import { FEEDBACK_CARE, FEEDBACK_HIGHLIGHTS, FEEDBACK_STAGES, RATING_LABELS, type Feedback } from "./feedback";

/**
 * Campos de los formularios «valoracion» y «posventa» en Netlify Forms.
 * Deben coincidir con public/__forms.html (lo comprueba una prueba).
 * El primer campo de texto (nombre) es el título y el primer textarea, el cuerpo.
 */

export const FEEDBACK_FORM = "valoracion";
export const AFTERCARE_FORM = "posventa";
export const AFTERCARE_PHOTO_FIELDS = Array.from({ length: AFTERCARE_MAX_PHOTOS }, (_, i) => `foto_${i + 1}`);

export const FEEDBACK_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "referencia",
  "puntuacion",
  "estrellas",
  "fase",
  "atencion",
  "destacado",
  "quiere_llamada",
  "publicar",
  "privacidad",
  "enviado_el",
  "comentario",
  "formulario",
  "datos_json",
  "subject",
  "bot-field",
] as const;

export const AFTERCARE_FIELDS = [
  "nombre",
  "telefono",
  "email",
  "referencia",
  "localidad",
  "tipo_ayuda",
  "urgencia",
  "privacidad",
  "enviado_el",
  "descripcion",
  "formulario",
  "datos_json",
  "subject",
  ...AFTERCARE_PHOTO_FIELDS,
  "bot-field",
] as const;

const madrid = (d: Date) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", dateStyle: "full", timeStyle: "short" }).format(d);
const yes = (b: boolean) => (b ? "Sí" : "No");

export function feedbackFields(f: Feedback, now = new Date()): Record<(typeof FEEDBACK_FIELDS)[number], string> {
  return {
    nombre: f.name ?? "",
    telefono: f.phone ?? "",
    email: f.email ?? "",
    referencia: f.reference ?? "",
    puntuacion: `${f.rating}/5 · ${RATING_LABELS[f.rating]}`,
    estrellas: `${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}`,
    fase: labelOf(FEEDBACK_STAGES, f.stage),
    atencion: labelOf(FEEDBACK_CARE, f.care),
    destacado: f.highlights.map((h) => labelOf(FEEDBACK_HIGHLIGHTS, h)).join(", "),
    quiere_llamada: yes(f.callback),
    publicar: yes(f.publish),
    privacidad: "Aceptada",
    enviado_el: madrid(now),
    comentario: f.comment ?? "",
    formulario: FEEDBACK_FORM,
    datos_json: JSON.stringify(f),
    subject: `Valoración ${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)} (${f.rating}/5)${f.name ? ` · ${f.name}` : ""}`,
    "bot-field": "",
  };
}

export function aftercareFields(a: Aftercare, now = new Date()): Record<Exclude<(typeof AFTERCARE_FIELDS)[number], `foto_${number}`>, string> {
  return {
    nombre: a.name,
    telefono: a.phone,
    email: a.email ?? "",
    referencia: a.reference ?? "",
    localidad: a.locality ?? "",
    tipo_ayuda: labelOf(AFTERCARE_KINDS, a.kind),
    urgencia: labelOf(AFTERCARE_URGENCY, a.urgency),
    privacidad: "Aceptada",
    enviado_el: madrid(now),
    descripcion: a.description,
    formulario: AFTERCARE_FORM,
    datos_json: JSON.stringify(a),
    subject: `${a.urgency === "urgente" ? "URGENTE · " : ""}Posventa · ${labelOf(AFTERCARE_KINDS, a.kind)} · ${a.name}`,
    "bot-field": "",
  };
}
