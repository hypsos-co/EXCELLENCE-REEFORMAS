import { z } from "zod";
import {
  BUDGET_RANGES,
  DETAIL_QUESTIONS,
  OCCUPANCY,
  PROPERTY_TYPES,
  PROVINCES,
  REFORM_TYPE_IDS,
  TIMINGS,
  extraServicesFor,
  type ReformType,
} from "./options";

/**
 * Esquema de una solicitud de presupuesto.
 * Se usa en el navegador (validación inmediata por paso) y en el servidor
 * (validación definitiva). El servidor nunca confía en la validación del cliente.
 */

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((o) => o.id) as unknown as [T[number]["id"], ...T[number]["id"][]];

export const MAX_TEXT = 2000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres.` })
    .optional()
    .transform((v) => (v ? v : undefined));

/** Normaliza un teléfono: quita espacios, guiones, puntos y paréntesis. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

const SPANISH_PHONE = /^(?:\+34|0034|34)?[6789]\d{8}$/;
const INTL_PHONE = /^(?:\+|00)[1-9]\d{6,14}$/;

export function isValidPhone(raw: string): boolean {
  const p = normalizePhone(raw);
  return SPANISH_PHONE.test(p) || INTL_PHONE.test(p);
}

/* ------------------------------ Secciones ------------------------------ */

export const reformSchema = z.object({
  primary: z.enum(REFORM_TYPE_IDS, { error: "Elige el tipo de reforma para continuar." }),
  extras: z.array(z.enum(REFORM_TYPE_IDS)).max(5).default([]),
});

export const propertySchema = z.object({
  type: z.enum(ids(PROPERTY_TYPES), { error: "Indícanos el tipo de inmueble." }),
  occupancy: z.enum(ids(OCCUPANCY)).optional(),
});

export const detailSchema = z.object({
  size: z.string().max(40).optional(),
  items: z.array(z.string().max(40)).max(12).default([]),
  other: optionalText(300),
  description: optionalText(MAX_TEXT),
});
export type DetailAnswer = z.infer<typeof detailSchema>;

export const locationSchema = z.object({
  locality: z
    .string({ error: "Indica la localidad." })
    .trim()
    .min(2, { error: "Indica la localidad." })
    .max(80, { error: "Máximo 80 caracteres." }),
  province: z.enum(PROVINCES, { error: "Selecciona la provincia." }),
  postalCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(v), {
      error: "El código postal debe tener 5 dígitos (por ejemplo, 28001).",
    }),
});

export const planningSchema = z.object({
  timing: z.enum(ids(TIMINGS)).optional(),
  budget: z.enum(ids(BUDGET_RANGES)).optional(),
});

export const contactSchema = z.object({
  name: z
    .string({ error: "Escribe tu nombre y apellidos." })
    .trim()
    .min(2, { error: "Escribe tu nombre y apellidos." })
    .max(100, { error: "Máximo 100 caracteres." })
    .refine((v) => /\p{L}/u.test(v), { error: "Escribe tu nombre y apellidos." }),
  phone: z
    .string({ error: "Necesitamos un teléfono para poder llamarte." })
    .trim()
    .min(1, { error: "Necesitamos un teléfono para poder llamarte." })
    .max(24, { error: "Introduce un teléfono válido (por ejemplo, 600 123 456)." })
    .refine(isValidPhone, { error: "Introduce un teléfono válido (por ejemplo, 600 123 456)." }),
  email: z
    .string({ error: "Escribe tu email." })
    .trim()
    .min(1, { error: "Escribe tu email." })
    .max(254, { error: "El email es demasiado largo." })
    .pipe(z.email({ error: "Revisa el email: parece incompleto (ejemplo: nombre@correo.com)." })),
});

export const consentSchema = z.object({
  privacy: z.literal(true, {
    error: "Para enviar la solicitud debes aceptar la política de privacidad.",
  }),
  policyVersion: z.string().max(20),
});

/* ---------------------- Reglas del paso «Detalles» --------------------- */

export type DetailIssue = { path: (string | number)[]; message: string };
type DetailLike = { size?: string; items: string[]; other?: string; description?: string };

/** Valida las respuestas del paso 3 para los servicios seleccionados. */
export function checkDetails(
  services: ReformType[],
  details: Partial<Record<ReformType, DetailLike>>,
): DetailIssue[] {
  const issues: DetailIssue[] = [];
  for (const service of services) {
    const q = DETAIL_QUESTIONS[service];
    const answer = details[service];
    if (q.description) {
      const text = answer?.description?.trim() ?? "";
      if (text.length < 10) {
        issues.push({
          path: ["details", service, "description"],
          message: "Cuéntanos un poco más sobre tu proyecto (al menos 10 caracteres).",
        });
      }
    }
    if (!answer) continue;
    if (answer.size && !q.size?.options.some((o) => o.id === answer.size)) {
      issues.push({ path: ["details", service, "size"], message: "Opción no válida." });
    }
    const valid = new Set(q.items?.options.map((o) => o.id) ?? []);
    if (answer.items.some((i) => !valid.has(i))) {
      issues.push({ path: ["details", service, "items"], message: "Opción no válida." });
    }
    if (q.items?.exclusive && answer.items.includes(q.items.exclusive) && answer.items.length > 1) {
      issues.push({
        path: ["details", service, "items"],
        message: "Si eliges la opción completa no hace falta marcar las demás.",
      });
    }
  }
  return issues;
}

/** Servicios cuyo detalle se pregunta: principal + extras válidos. */
export function selectedServices(reform: { primary?: ReformType; extras?: ReformType[] }): ReformType[] {
  if (!reform.primary) return [];
  const allowed = new Set(extraServicesFor(reform.primary));
  const extras = (reform.extras ?? []).filter((e) => allowed.has(e));
  return [reform.primary, ...extras];
}

/* --------------------------- Solicitud completa ------------------------ */

export const budgetRequestSchema = z
  .object({
    version: z.literal(1),
    reform: reformSchema,
    property: propertySchema,
    details: z.partialRecord(z.enum(REFORM_TYPE_IDS), detailSchema).default({}),
    location: locationSchema,
    planning: planningSchema.default({}),
    description: optionalText(MAX_TEXT),
    contact: contactSchema,
    consent: consentSchema,
  })
  .superRefine((data, ctx) => {
    const allowed = new Set(extraServicesFor(data.reform.primary));
    data.reform.extras.forEach((e, i) => {
      if (!allowed.has(e)) {
        ctx.addIssue({ code: "custom", path: ["reform", "extras", i], message: "Servicio adicional no válido." });
      }
    });
    for (const issue of checkDetails(selectedServices(data.reform), data.details)) {
      ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
  })
  .transform((data) => {
    // Conserva solo los detalles de los servicios seleccionados.
    const services = selectedServices(data.reform);
    const details: Partial<Record<ReformType, DetailAnswer>> = {};
    for (const s of services) {
      const d = data.details[s];
      if (!d) continue;
      const otherKey = DETAIL_QUESTIONS[s].items?.other;
      details[s] = {
        ...d,
        other: otherKey && d.items.includes(otherKey) ? d.other : undefined,
      };
    }
    return { ...data, reform: { ...data.reform, extras: services.slice(1) }, details };
  });

export type BudgetRequestInput = z.input<typeof budgetRequestSchema>;
export type BudgetRequest = z.output<typeof budgetRequestSchema>;

/** Convierte los errores de zod en un mapa «ruta → mensaje» (el primero por ruta). */
export function issuesToFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
