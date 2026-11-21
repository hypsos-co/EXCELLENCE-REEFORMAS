import { z } from "zod";
import { isValidPhone } from "@/lib/budget/schema";

/** Formulario de posventa: revisiones, pequeños arreglos y dudas de clientes. */

export const AFTERCARE_KINDS = [
  { id: "revision", label: "Revisión de la obra" },
  { id: "arreglo", label: "Pequeño arreglo" },
  { id: "duda", label: "Duda de mantenimiento" },
  { id: "nueva", label: "Nueva reforma" },
] as const;

export const AFTERCARE_URGENCY = [
  { id: "normal", label: "Sin prisa" },
  { id: "pronto", label: "Lo antes posible" },
  { id: "urgente", label: "Urgente" },
] as const;

export const AFTERCARE_MAX_PHOTOS = 3;

const ids = <T extends readonly { id: string }[]>(l: T) => l.map((o) => o.id) as unknown as [T[number]["id"], ...T[number]["id"][]];
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres.` })
    .optional()
    .transform((v) => (v ? v : undefined));

export const aftercareSchema = z.object({
  kind: z.enum(ids(AFTERCARE_KINDS), { error: "Elige qué necesitas." }),
  urgency: z.enum(ids(AFTERCARE_URGENCY)).default("normal"),
  description: z
    .string({ error: "Cuéntanos qué necesitas." })
    .trim()
    .min(10, { error: "Cuéntanos un poco más (al menos 10 caracteres)." })
    .max(1500, { error: "Máximo 1500 caracteres." }),
  name: z.string({ error: "Escribe tu nombre." }).trim().min(2, { error: "Escribe tu nombre." }).max(100),
  phone: z
    .string({ error: "Necesitamos un teléfono." })
    .trim()
    .min(1, { error: "Necesitamos un teléfono." })
    .max(24)
    .refine(isValidPhone, { error: "Revisa el teléfono (por ejemplo, 600 123 456)." }),
  email: optText(254).refine((v) => !v || z.email().safeParse(v).success, { error: "Revisa el email." }),
  locality: optText(80),
  reference: optText(20),
  privacy: z.literal(true, { error: "Debes aceptar la política de privacidad." }),
});

export type AftercareInput = z.input<typeof aftercareSchema>;
export type Aftercare = z.output<typeof aftercareSchema>;
