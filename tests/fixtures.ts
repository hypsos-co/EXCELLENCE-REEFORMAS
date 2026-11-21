import type { BudgetRequestInput } from "@/lib/budget/schema";

export function validRequest(overrides: Partial<BudgetRequestInput> = {}): BudgetRequestInput {
  return {
    version: 1,
    reform: { primary: "cocina", extras: ["bano"] },
    property: { type: "piso", occupancy: "si" },
    details: {
      cocina: { size: "mediana", items: ["muebles", "otros"], other: "Quitar un tabique" },
      bano: { size: "no-se", items: ["banera-ducha"] },
    },
    location: { locality: "Alcobendas", province: "Madrid", postalCode: "28100" },
    planning: { timing: "1-3-meses", budget: "10000-20000" },
    description: "Cocina luminosa y baño con plato de ducha.",
    contact: { name: "Lucía Martín", phone: "612 345 678", email: "lucia@example.com" },
    consent: { privacy: true, policyVersion: "2026-11-21" },
    ...overrides,
  };
}

/** JPEG mínimo válido (cabecera real + relleno). */
export function fakeJpeg(size = 2048): Uint8Array {
  const b = new Uint8Array(size);
  b.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  b[size - 2] = 0xff;
  b[size - 1] = 0xd9;
  return b;
}
