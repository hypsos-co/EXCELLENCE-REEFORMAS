import { z } from "zod";
import { isValidPhone } from "@/lib/budget/schema";

/** Formulario «¿Cómo lo estamos haciendo?» (valoración y seguimiento del cliente). */

export const FEEDBACK_STAGES = [
  { id: "presupuesto", label: "Pidiendo presupuesto" },
  { id: "obra", label: "Obra en curso" },
  { id: "terminada", label: "Obra terminada" },
] as const;

export const FEEDBACK_CARE = [
  { id: "si", label: "Sí, muy bien" },
  { id: "regular", label: "Podría mejorar" },
  { id: "no", label: "No" },
] as const;

export const FEEDBACK_HIGHLIGHTS = [
  { id: "trato", label: "El trato" },
  { id: "comunicacion", label: "La comunicación" },
  { id: "puntualidad", label: "La puntualidad" },
  { id: "limpieza", label: "La limpieza" },
  { id: "calidad", label: "La calidad del trabajo" },
  { id: "asesoramiento", label: "El asesoramiento" },
] as const;

export const RATING_LABELS = ["Sin valorar", "Muy mal", "Mal", "Normal", "Bien", "¡Excelente!"] as const;

const ids = <T extends readonly { id: string }[]>(l: T) => l.map((o) => o.id) as unknown as [T[number]["id"], ...T[number]["id"][]];
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres.` })
    .optional()
    .transform((v) => (v ? v : undefined));

export const feedbackSchema = z
  .object({
    rating: z.number({ error: "Elige de 1 a 5 estrellas." }).int().min(1, { error: "Elige de 1 a 5 estrellas." }).max(5),
    stage: z.enum(ids(FEEDBACK_STAGES)).optional(),
    care: z.enum(ids(FEEDBACK_CARE)).optional(),
    highlights: z.array(z.enum(ids(FEEDBACK_HIGHLIGHTS))).max(6).default([]),
    comment: optText(1500),
    name: optText(100),
    phone: optText(24).refine((v) => !v || isValidPhone(v), { error: "Revisa el teléfono (por ejemplo, 600 123 456)." }),
    email: optText(254).refine((v) => !v || z.email().safeParse(v).success, { error: "Revisa el email." }),
    reference: optText(20),
    callback: z.boolean().default(false),
    publish: z.boolean().default(false),
    privacy: z.literal(true, { error: "Debes aceptar la política de privacidad." }),
  })
  .superRefine((d, ctx) => {
    if (d.callback && !d.phone && !d.email) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Déjanos un teléfono o email para poder contactarte." });
    }
    if (d.publish && !d.name) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Para publicar tu opinión necesitamos tu nombre." });
    }
  });

export type FeedbackInput = z.input<typeof feedbackSchema>;
export type Feedback = z.output<typeof feedbackSchema>;

/** ¿Necesita atención prioritaria? (cliente insatisfecho o pide llamada). */
export function needsAttention(f: Pick<Feedback, "rating" | "care" | "callback">): boolean {
  return f.rating <= 3 || f.care === "no" || f.callback;
}
