import { describe, expect, it } from "vitest";
import { budgetRequestSchema, isValidPhone } from "@/lib/budget/schema";
import { validRequest } from "./fixtures";

describe("budgetRequestSchema", () => {
  it("acepta una solicitud completa y conserva los datos", () => {
    const r = budgetRequestSchema.parse(validRequest());
    expect(r.reform).toEqual({ primary: "cocina", extras: ["bano"] });
    expect(r.details.cocina?.other).toBe("Quitar un tabique");
    expect(r.location.postalCode).toBe("28100");
  });

  it("solo exige lo imprescindible: tipo, inmueble, localidad, contacto y consentimiento", () => {
    const r = budgetRequestSchema.safeParse(
      validRequest({ details: {}, planning: {}, description: undefined, location: { locality: "Getafe", province: "Madrid" } }),
    );
    expect(r.success).toBe(true);
  });

  it("descarta detalles de servicios no seleccionados y el texto «otros» si no se marcó", () => {
    const r = budgetRequestSchema.parse(
      validRequest({
        reform: { primary: "cocina", extras: [] },
        details: { cocina: { items: ["muebles"], other: "no debería guardarse" }, pintura: { items: ["techos"] } },
      }),
    );
    expect(Object.keys(r.details)).toEqual(["cocina"]);
    expect(r.details.cocina?.other).toBeUndefined();
  });

  it("no permite servicios adicionales con reforma integral", () => {
    const r = budgetRequestSchema.safeParse(validRequest({ reform: { primary: "integral", extras: ["bano"] }, details: {} }));
    expect(r.success).toBe(false);
  });

  it("exige descripción en «Otra reforma»", () => {
    const base = validRequest({ reform: { primary: "otra", extras: [] }, details: {} });
    expect(budgetRequestSchema.safeParse(base).success).toBe(false);
    const ok = { ...base, details: { otra: { items: [], description: "Cambiar todas las puertas de la casa" } } };
    expect(budgetRequestSchema.safeParse(ok).success).toBe(true);
  });

  it("rechaza opciones inventadas y combinaciones excluyentes", () => {
    expect(budgetRequestSchema.safeParse(validRequest({ details: { cocina: { size: "gigante", items: [] } } })).success).toBe(false);
    expect(
      budgetRequestSchema.safeParse(validRequest({ details: { cocina: { items: ["completa", "encimera"] } } })).success,
    ).toBe(false);
  });

  it("valida código postal, email y consentimiento", () => {
    expect(budgetRequestSchema.safeParse(validRequest({ location: { locality: "Madrid", province: "Madrid", postalCode: "99999" } })).success).toBe(false);
    expect(budgetRequestSchema.safeParse(validRequest({ contact: { name: "Ana", phone: "600000000", email: "ana@" } })).success).toBe(false);
    expect(
      budgetRequestSchema.safeParse(validRequest({ consent: { privacy: false as true, policyVersion: "x" } })).success,
    ).toBe(false);
  });
});

describe("isValidPhone", () => {
  it.each(["612 345 678", "+34 612345678", "0034612345678", "912-345-678", "+44 7700 900123"])("acepta %s", (p) => {
    expect(isValidPhone(p)).toBe(true);
  });
  it.each(["12345", "512345678", "abcdefghi", ""])("rechaza %s", (p) => {
    expect(isValidPhone(p)).toBe(false);
  });
});
