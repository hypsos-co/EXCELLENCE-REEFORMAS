import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  NETLIFY_FIELDS,
  NETLIFY_FORM_NAME,
  NETLIFY_HONEYPOT,
  NETLIFY_PHOTO_FIELDS,
  buildNetlifyFormData,
  type NetlifyDraft,
} from "@/lib/budget/netlify-form";

const skeleton = readFileSync("public/__forms.html", "utf8");
const skeletonFields = [...skeleton.matchAll(/<(?:input|textarea)[^>]*\sname="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== "form-name");

const draft: NetlifyDraft = {
  reform: { primary: "cocina", extras: ["bano"] },
  property: { type: "piso", occupancy: "si" },
  details: { cocina: { size: "mediana", items: ["muebles"] }, bano: { items: ["banera-ducha"] } },
  location: { locality: "Aranjuez", province: "Madrid", postalCode: "28300" },
  planning: { timing: "1-3-meses" },
  description: "Cocina luminosa",
  contact: { name: "Lucía Martín", phone: "612 345 678", email: "lucia@example.com" },
};

describe("Netlify Forms", () => {
  it("el esqueleto declara el formulario con detección, honeypot y subida de archivos", () => {
    expect(skeleton).toMatch(new RegExp(`<form[^>]*name="${NETLIFY_FORM_NAME}"[^>]*data-netlify="true"`));
    expect(skeleton).toContain(`netlify-honeypot="${NETLIFY_HONEYPOT}"`);
    expect(skeleton).toContain('enctype="multipart/form-data"');
    expect(skeleton).toContain(`<input type="hidden" name="form-name" value="${NETLIFY_FORM_NAME}" />`);
  });

  it("los campos del esqueleto y los del código coinciden exactamente", () => {
    expect(skeletonFields).toEqual([...NETLIFY_FIELDS]);
  });

  it("el primer campo de texto es el nombre y el primer textarea el resumen (título y cuerpo en Netlify)", () => {
    expect(skeleton.indexOf('name="nombre"')).toBeLessThan(skeleton.indexOf('name="telefono"'));
    expect(skeleton.match(/<textarea name="([^"]+)"/)?.[1]).toBe("resumen");
  });

  it("el envío solo usa campos registrados y una foto por campo", () => {
    const photos = Array.from({ length: 6 }, (_, i) => new File([new Uint8Array(10)], `f${i}.jpg`, { type: "image/jpeg" }));
    const fd = buildNetlifyFormData(draft, {
      reference: "ER-261121-ABCD",
      photos,
      honeypot: "",
      privacyVersion: "2026-11-21",
      now: new Date("2026-11-21T15:00:00Z"),
    });
    const keys = [...fd.keys()];
    expect(fd.get("form-name")).toBe(NETLIFY_FORM_NAME);
    for (const k of keys.filter((k) => k !== "form-name")) expect(NETLIFY_FIELDS).toContain(k);
    for (const f of NETLIFY_PHOTO_FIELDS) expect(fd.getAll(f)).toHaveLength(1);
    expect(fd.get("subject")).toBe("Nueva solicitud ER-261121-ABCD · Cocina + Baño · Aranjuez");
    expect(fd.get("zona")).toBe("Fuera de la zona habitual");
    expect(fd.get("enviado_el")).toContain("21 de noviembre de 2026");
    const resumen = String(fd.get("resumen"));
    expect(resumen).toContain("Tipo de reforma: Cocina + Baño");
    expect(resumen).toContain("FUERA de la zona habitual");
    expect(resumen).toContain("WhatsApp del cliente: https://wa.me/34612345678");
    expect(resumen).toContain("Fotos adjuntas: 6");
  });
});
