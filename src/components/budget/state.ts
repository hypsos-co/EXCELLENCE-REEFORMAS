import {
  DETAIL_QUESTIONS,
  extraServicesFor,
  type BudgetRange,
  type Occupancy,
  type PropertyType,
  type ReformType,
  type Timing,
} from "@/lib/budget/options";
import {
  MAX_TEXT,
  checkDetails,
  contactSchema,
  issuesToFieldErrors,
  locationSchema,
  propertySchema,
  reformSchema,
  selectedServices,
  type BudgetRequestInput,
} from "@/lib/budget/schema";
import { siteConfig } from "@/config/site";

/* ------------------------------- Pasos --------------------------------- */

export const STEPS = [
  { id: "tipo", short: "Tipo de reforma" },
  { id: "inmueble", short: "Inmueble" },
  { id: "detalles", short: "Detalles" },
  { id: "ubicacion", short: "Ubicación" },
  { id: "plazos", short: "Plazos y presupuesto" },
  { id: "fotos", short: "Fotos e ideas" },
  { id: "contacto", short: "Contacto" },
] as const;

export type StepId = (typeof STEPS)[number]["id"] | "resumen";
export const TOTAL_STEPS = STEPS.length;
export const SUMMARY_INDEX = STEPS.length; // índice del resumen

/** Mensajes de acompañamiento por paso (conversión y confianza). */
export const STEP_MESSAGES: Record<StepId, string> = {
  tipo: "Cada proyecto es diferente. Queremos conocer el tuyo.",
  inmueble: "Solo unos datos básicos para situarnos.",
  detalles: "Responde solo lo que sepas: el resto lo vemos contigo.",
  ubicacion: `Trabajamos en ${siteConfig.serviceArea.label}.`,
  plazos: "Los rangos son orientativos: nos ayudan a entender tus expectativas.",
  fotos: "Cuantos más detalles nos proporciones, mejor podremos entender tu idea.",
  contacto: "Estamos un paso más cerca de tu próximo Glow Up.",
  resumen: "Tu solicitud llegará directamente a Excellence Reformas.",
};

/* ------------------------------- Estado -------------------------------- */

export type DetailDraft = { size?: string; items: string[]; other?: string; description?: string };

export type Draft = {
  reform: { primary?: ReformType; extras: ReformType[] };
  property: { type?: PropertyType; occupancy?: Occupancy };
  details: Partial<Record<ReformType, DetailDraft>>;
  location: { locality: string; province: string; postalCode: string };
  planning: { timing?: Timing; budget?: BudgetRange };
  description: string;
  contact: { name: string; phone: string; email: string };
  consent: boolean;
};

export function initialDraft(primary?: ReformType): Draft {
  return {
    reform: { primary, extras: [] },
    property: {},
    details: {},
    location: { locality: "", province: siteConfig.serviceArea.provinces[0] ?? "Madrid", postalCode: "" },
    planning: {},
    description: "",
    contact: { name: "", phone: "", email: "" },
    consent: false,
  };
}

export type Action =
  | { type: "setPrimary"; value: ReformType }
  | { type: "toggleExtra"; value: ReformType }
  | { type: "setProperty"; value: Partial<Draft["property"]> }
  | { type: "setSize"; service: ReformType; value: string }
  | { type: "toggleItem"; service: ReformType; value: string }
  | { type: "setDetailText"; service: ReformType; field: "other" | "description"; value: string }
  | { type: "setLocation"; value: Partial<Draft["location"]> }
  | { type: "setPlanning"; value: Partial<Draft["planning"]> }
  | { type: "setDescription"; value: string }
  | { type: "setContact"; value: Partial<Draft["contact"]> }
  | { type: "setConsent"; value: boolean };

const emptyDetail = (): DetailDraft => ({ items: [] });

export function reducer(state: Draft, action: Action): Draft {
  switch (action.type) {
    case "setPrimary": {
      const allowed = new Set(extraServicesFor(action.value));
      return { ...state, reform: { primary: action.value, extras: state.reform.extras.filter((e) => allowed.has(e)) } };
    }
    case "toggleExtra": {
      const has = state.reform.extras.includes(action.value);
      return {
        ...state,
        reform: {
          ...state.reform,
          extras: has ? state.reform.extras.filter((e) => e !== action.value) : [...state.reform.extras, action.value],
        },
      };
    }
    case "setProperty":
      return { ...state, property: { ...state.property, ...action.value } };
    case "setSize": {
      const d = state.details[action.service] ?? emptyDetail();
      return { ...state, details: { ...state.details, [action.service]: { ...d, size: action.value } } };
    }
    case "toggleItem": {
      const d = state.details[action.service] ?? emptyDetail();
      const exclusive = DETAIL_QUESTIONS[action.service].items?.exclusive;
      let items: string[];
      if (d.items.includes(action.value)) items = d.items.filter((i) => i !== action.value);
      else if (action.value === exclusive) items = [action.value];
      else items = [...d.items.filter((i) => i !== exclusive), action.value];
      return { ...state, details: { ...state.details, [action.service]: { ...d, items } } };
    }
    case "setDetailText": {
      const d = state.details[action.service] ?? emptyDetail();
      return { ...state, details: { ...state.details, [action.service]: { ...d, [action.field]: action.value } } };
    }
    case "setLocation":
      return { ...state, location: { ...state.location, ...action.value } };
    case "setPlanning":
      return { ...state, planning: { ...state.planning, ...action.value } };
    case "setDescription":
      return { ...state, description: action.value };
    case "setContact":
      return { ...state, contact: { ...state.contact, ...action.value } };
    case "setConsent":
      return { ...state, consent: action.value };
  }
}

/* ----------------------------- Validación ------------------------------ */

export type FieldErrors = Record<string, string>;

export function validateStep(step: StepId, d: Draft): FieldErrors {
  switch (step) {
    case "tipo": {
      const r = reformSchema.safeParse(d.reform);
      return r.success ? {} : prefix("reform", issuesToFieldErrors(r.error.issues));
    }
    case "inmueble": {
      const r = propertySchema.safeParse(d.property);
      return r.success ? {} : prefix("property", issuesToFieldErrors(r.error.issues));
    }
    case "detalles":
      return issuesToFieldErrors(checkDetails(selectedServices(d.reform), d.details));
    case "ubicacion": {
      const r = locationSchema.safeParse(d.location);
      return r.success ? {} : prefix("location", issuesToFieldErrors(r.error.issues));
    }
    case "plazos":
      return {};
    case "fotos":
      return d.description.length > MAX_TEXT ? { description: `Máximo ${MAX_TEXT} caracteres.` } : {};
    case "contacto": {
      const r = contactSchema.safeParse(d.contact);
      const errors = r.success ? {} : prefix("contact", issuesToFieldErrors(r.error.issues));
      if (!d.consent) errors["consent.privacy"] = "Para enviar la solicitud debes aceptar la política de privacidad.";
      return errors;
    }
    case "resumen":
      return {};
  }
}

function prefix(p: string, errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k ? `${p}.${k}` : p, v]));
}

/** Paso al que pertenece un campo devuelto por el servidor. */
export function stepForField(path: string): StepId {
  if (path.startsWith("reform")) return "tipo";
  if (path.startsWith("property")) return "inmueble";
  if (path.startsWith("details")) return "detalles";
  if (path.startsWith("location")) return "ubicacion";
  if (path.startsWith("planning")) return "plazos";
  if (path.startsWith("description") || path.startsWith("photos")) return "fotos";
  return "contacto";
}

/** Id del elemento HTML asociado a una ruta de campo (para mover el foco). */
export function fieldId(path: string): string {
  return `f-${path.replace(/\./g, "-")}`;
}

/* ------------------------------- Envío --------------------------------- */

export function toPayload(d: Draft): BudgetRequestInput {
  const services = selectedServices(d.reform);
  const details: BudgetRequestInput["details"] = {};
  for (const s of services) {
    const x = d.details[s];
    if (x) details[s] = { size: x.size, items: x.items, other: x.other, description: x.description };
  }
  return {
    version: 1,
    reform: { primary: d.reform.primary!, extras: services.slice(1) },
    property: { type: d.property.type!, occupancy: d.property.occupancy },
    details,
    location: {
      locality: d.location.locality,
      province: d.location.province as BudgetRequestInput["location"]["province"],
      postalCode: d.location.postalCode || undefined,
    },
    planning: d.planning,
    description: d.description || undefined,
    contact: d.contact,
    consent: { privacy: d.consent as true, policyVersion: siteConfig.legal.privacyPolicyVersion },
  };
}

export function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
