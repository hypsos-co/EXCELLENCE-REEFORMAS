import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/budget/whatsapp";

describe("WhatsApp", () => {
  it("construye el mensaje personalizado", () => {
    const msg = buildWhatsAppMessage({
      name: "Lucía Martín",
      reform: "Cocina + Baño",
      locality: "Alcobendas",
      description: "Cocina   luminosa\ny baño nuevo",
      reference: "ER-261121-ABCD",
    });
    expect(msg).toBe(
      [
        "Hola, soy Lucía Martín. Acabo de enviar una solicitud de presupuesto desde vuestra web (ref. ER-261121-ABCD).",
        "",
        "Tipo de reforma: Cocina + Baño",
        "Localidad: Alcobendas",
        "Descripción: Cocina luminosa y baño nuevo",
        "",
        "Me gustaría hablar con vosotros sobre mi proyecto.",
      ].join("\n"),
    );
  });

  it("omite la descripción vacía y recorta las largas", () => {
    expect(buildWhatsAppMessage({ name: "A", reform: "Baño", locality: "Madrid" })).not.toContain("Descripción");
    const long = buildWhatsAppMessage({ name: "A", reform: "Baño", locality: "Madrid", description: "x".repeat(900) });
    expect(long).toMatch(/x…\n/);
  });

  it("genera un enlace wa.me con el número limpio y el texto codificado", () => {
    expect(buildWhatsAppUrl("+34 600 000 000", "Hola & adiós")).toBe("https://wa.me/34600000000?text=Hola%20%26%20adi%C3%B3s");
    expect(buildWhatsAppUrl("", "x")).toBeNull();
  });
});
