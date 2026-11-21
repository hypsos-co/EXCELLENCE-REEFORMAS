/**
 * Catálogo de opciones del asistente EXCELLENCE SMART BUDGET.
 * Compartido entre el navegador (asistente) y el servidor (validación y email),
 * de modo que una opción solo existe si está definida aquí.
 */

export type Option<Id extends string = string> = {
  readonly id: Id;
  readonly label: string;
  readonly hint?: string;
};

/* ----------------------------- Paso 1 ---------------------------------- */

export const REFORM_TYPES = [
  { id: "integral", label: "Reforma integral", hint: "Toda la vivienda, de principio a fin" },
  { id: "cocina", label: "Cocina", hint: "Muebles, encimera, distribución…" },
  { id: "bano", label: "Baño", hint: "Plato de ducha, alicatado, sanitarios…" },
  { id: "pintura", label: "Pintura", hint: "Paredes, techos y acabados decorativos" },
  { id: "albanileria", label: "Albañilería", hint: "Tabiques, suelos, alicatados, reparaciones" },
  { id: "otra", label: "Otra reforma", hint: "Cuéntanos tu idea con tus palabras" },
] as const satisfies readonly Option[];

export type ReformType = (typeof REFORM_TYPES)[number]["id"];
export const REFORM_TYPE_IDS = REFORM_TYPES.map((o) => o.id) as [ReformType, ...ReformType[]];

/** Servicios que se pueden añadir como extra a un servicio principal. */
export function extraServicesFor(primary: ReformType | undefined): ReformType[] {
  if (!primary || primary === "integral") return [];
  return REFORM_TYPE_IDS.filter((id) => id !== primary && id !== "integral" && id !== "otra");
}

/* ----------------------------- Paso 2 ---------------------------------- */

export const PROPERTY_TYPES = [
  { id: "piso", label: "Piso" },
  { id: "casa", label: "Casa unifamiliar" },
  { id: "local", label: "Local comercial" },
  { id: "otro", label: "Otro tipo de inmueble" },
] as const satisfies readonly Option[];
export type PropertyType = (typeof PROPERTY_TYPES)[number]["id"];

export const OCCUPANCY = [
  { id: "si", label: "Sí" },
  { id: "no", label: "No" },
  { id: "parcial", label: "Parcialmente" },
] as const satisfies readonly Option[];
export type Occupancy = (typeof OCCUPANCY)[number]["id"];

/* ----------------------------- Paso 3 ---------------------------------- */

export type DetailQuestions = {
  /** Pregunta de tamaño (respuesta única, siempre incluye «No lo sé»). */
  readonly size?: { readonly label: string; readonly options: readonly Option[] };
  /** Pregunta de selección múltiple. */
  readonly items?: {
    readonly label: string;
    readonly options: readonly Option[];
    /** Opción que excluye a las demás (p. ej. «Reforma completa»). */
    readonly exclusive?: string;
    /** Opción que despliega un campo de texto libre opcional. */
    readonly other?: string;
  };
  /** Descripción libre (solo «Otra reforma»). */
  readonly description?: { readonly label: string; readonly placeholder: string };
};

export const DETAIL_QUESTIONS: Record<ReformType, DetailQuestions> = {
  bano: {
    size: {
      label: "¿Qué tamaño aproximado tiene?",
      options: [
        { id: "menos-4", label: "Menos de 4 m²" },
        { id: "4-8", label: "Entre 4 y 8 m²" },
        { id: "mas-8", label: "Más de 8 m²" },
        { id: "no-se", label: "No lo sé" },
      ],
    },
    items: {
      label: "¿Qué necesitas renovar?",
      exclusive: "completa",
      other: "otros",
      options: [
        { id: "completa", label: "Reforma completa" },
        { id: "banera-ducha", label: "Cambiar bañera por ducha" },
        { id: "alicatado-suelo", label: "Alicatado y suelo" },
        { id: "sanitarios-mobiliario", label: "Sanitarios y mobiliario" },
        { id: "otros", label: "Otros cambios" },
      ],
    },
  },
  cocina: {
    size: {
      label: "¿Qué tamaño aproximado tiene?",
      options: [
        { id: "pequena", label: "Pequeña" },
        { id: "mediana", label: "Mediana" },
        { id: "grande", label: "Grande" },
        { id: "no-se", label: "No lo sé" },
      ],
    },
    items: {
      label: "¿Qué quieres cambiar?",
      exclusive: "completa",
      other: "otros",
      options: [
        { id: "completa", label: "Reforma completa" },
        { id: "muebles", label: "Muebles y almacenamiento" },
        { id: "encimera", label: "Encimera" },
        { id: "suelo-paredes", label: "Suelo y paredes" },
        { id: "distribucion", label: "Distribución completa" },
        { id: "otros", label: "Otros cambios" },
      ],
    },
  },
  integral: {
    size: {
      label: "¿Qué superficie aproximada tiene la vivienda?",
      options: [
        { id: "menos-60", label: "Menos de 60 m²" },
        { id: "60-90", label: "Entre 60 y 90 m²" },
        { id: "90-120", label: "Entre 90 y 120 m²" },
        { id: "mas-120", label: "Más de 120 m²" },
        { id: "no-se", label: "No lo sé" },
      ],
    },
    items: {
      label: "¿Qué zonas quieres reformar?",
      exclusive: "toda",
      other: "otros",
      options: [
        { id: "toda", label: "Toda la vivienda" },
        { id: "cocina-banos", label: "Cocina y baños" },
        { id: "salon-habitaciones", label: "Salón y habitaciones" },
        { id: "varias", label: "Varias estancias" },
        { id: "otros", label: "Otros" },
      ],
    },
  },
  pintura: {
    items: {
      label: "¿Qué necesitas pintar?",
      exclusive: "vivienda-completa",
      other: "otro",
      options: [
        { id: "vivienda-completa", label: "Vivienda completa" },
        { id: "habitaciones", label: "Habitaciones" },
        { id: "salon", label: "Salón" },
        { id: "techos", label: "Techos" },
        { id: "fachada", label: "Fachada" },
        { id: "otro", label: "Otro" },
      ],
    },
  },
  albanileria: {
    items: {
      label: "¿Qué tipo de trabajo necesitas?",
      other: "otro",
      options: [
        { id: "tabiques", label: "Levantar o tirar tabiques" },
        { id: "alicatados", label: "Alicatados" },
        { id: "suelos", label: "Suelos" },
        { id: "revestimientos", label: "Revestimientos" },
        { id: "reparaciones", label: "Reparaciones" },
        { id: "otro", label: "Otro" },
      ],
    },
  },
  otra: {
    description: {
      label: "Explícanos tu proyecto",
      placeholder:
        "Por ejemplo: quiero cambiar las puertas de toda la casa y poner armarios empotrados en dos dormitorios…",
    },
  },
};

/* ----------------------------- Paso 5 ---------------------------------- */

export const TIMINGS = [
  { id: "asap", label: "Lo antes posible" },
  { id: "menos-1-mes", label: "En menos de un mes" },
  { id: "1-3-meses", label: "En 1-3 meses" },
  { id: "3-6-meses", label: "En 3-6 meses" },
  { id: "valorando", label: "Todavía estoy valorando opciones" },
] as const satisfies readonly Option[];
export type Timing = (typeof TIMINGS)[number]["id"];

/**
 * Rangos ORIENTATIVOS para conocer las expectativas del cliente.
 * No son precios de Excellence Reformas ni se usan para calcular presupuestos.
 */
export const BUDGET_RANGES = [
  { id: "menos-3000", label: "Menos de 3.000 €" },
  { id: "3000-6000", label: "Entre 3.000 y 6.000 €" },
  { id: "6000-10000", label: "Entre 6.000 y 10.000 €" },
  { id: "10000-20000", label: "Entre 10.000 y 20.000 €" },
  { id: "20000-40000", label: "Entre 20.000 y 40.000 €" },
  { id: "mas-40000", label: "Más de 40.000 €" },
  { id: "valorar", label: "Prefiero valorarlo primero" },
] as const satisfies readonly Option[];
export type BudgetRange = (typeof BUDGET_RANGES)[number]["id"];

/* ----------------------------- Paso 4 ---------------------------------- */

export const PROVINCES = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ceuta",
  "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa",
  "Huelva", "Huesca", "Jaén", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Melilla", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
  "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza",
] as const;

/* ----------------------------- Utilidades ------------------------------ */

export function labelOf(options: readonly Option[], id: string | undefined | null): string {
  if (!id) return "";
  return options.find((o) => o.id === id)?.label ?? id;
}

export function reformLabel(id: string | undefined): string {
  return labelOf(REFORM_TYPES, id);
}
