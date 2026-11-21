import {
  BUDGET_RANGES,
  DETAIL_QUESTIONS,
  OCCUPANCY,
  PROPERTY_TYPES,
  TIMINGS,
  labelOf,
  reformLabel,
  type ReformType,
} from "./options";
import { selectedServices, type DetailAnswer } from "./schema";

/**
 * Representación legible de una solicitud. Se usa en el resumen del asistente
 * y en el email que recibe Excellence Reformas, para que ambos digan lo mismo.
 */

export type SummaryDraft = {
  reform: { primary?: ReformType; extras?: ReformType[] };
  property: { type?: string; occupancy?: string };
  details: Partial<Record<ReformType, Partial<DetailAnswer>>>;
  location: { locality?: string; province?: string; postalCode?: string };
  planning: { timing?: string; budget?: string };
  description?: string;
  contact: { name?: string; phone?: string; email?: string };
};

export type SummaryRow = { label: string; value: string };

export function reformTitle(d: Pick<SummaryDraft, "reform">): string {
  const services = selectedServices(d.reform);
  if (!services.length) return "";
  const [first, ...rest] = services.map(reformLabel);
  return rest.length ? `${first} + ${rest.join(" + ")}` : first;
}

export function detailRows(d: Pick<SummaryDraft, "reform" | "details">): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const services = selectedServices(d.reform);
  const multi = services.length > 1;
  for (const s of services) {
    const q = DETAIL_QUESTIONS[s];
    const a = d.details[s];
    const prefix = multi ? `${reformLabel(s)} · ` : "";
    if (q.size) {
      rows.push({ label: `${prefix}${sizeLabel(s)}`, value: a?.size ? labelOf(q.size.options, a.size) : "Sin indicar" });
    }
    if (q.items) {
      const items = (a?.items ?? []).map((i) => labelOf(q.items!.options, i));
      let value = items.length ? items.join(", ") : "Sin indicar";
      if (a?.other && q.items.other && a.items?.includes(q.items.other)) value += ` (${a.other})`;
      rows.push({ label: `${prefix}${itemsLabel(s)}`, value });
    }
    if (q.description) {
      rows.push({ label: `${prefix}Descripción del proyecto`, value: a?.description?.trim() || "Sin indicar" });
    }
  }
  return rows;
}

function sizeLabel(s: ReformType) {
  return s === "integral" ? "Superficie" : "Tamaño";
}

function itemsLabel(s: ReformType) {
  switch (s) {
    case "integral":
      return "Zonas";
    case "pintura":
      return "Qué pintar";
    case "albanileria":
      return "Trabajos";
    case "cocina":
      return "Qué cambiar";
    default:
      return "Qué renovar";
  }
}

export function propertyText(d: Pick<SummaryDraft, "property">): string {
  const type = labelOf(PROPERTY_TYPES, d.property.type);
  if (!type) return "Sin indicar";
  const occ = d.property.occupancy;
  if (!occ) return type;
  const occText = { si: "habitada", no: "no habitada", parcial: "parcialmente habitada" }[occ] ?? labelOf(OCCUPANCY, occ);
  return `${type} · ${occText}`;
}

export function locationText(d: Pick<SummaryDraft, "location">): string {
  const { locality, province, postalCode } = d.location;
  return [locality?.trim(), postalCode?.trim(), province].filter(Boolean).join(", ") || "Sin indicar";
}

export function timingText(d: Pick<SummaryDraft, "planning">): string {
  return labelOf(TIMINGS, d.planning.timing) || "Sin indicar";
}

export function budgetText(d: Pick<SummaryDraft, "planning">): string {
  return labelOf(BUDGET_RANGES, d.planning.budget) || "No indicado";
}
