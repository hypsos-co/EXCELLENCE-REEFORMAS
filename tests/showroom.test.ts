import { describe, expect, it } from "vitest";
import { SHOWROOM_CATEGORIES, SHOWROOM_PHOTOS } from "@/content/showroom";

describe("contenido del showroom", () => {
  it("tiene fotos con id único, categoría válida, título y descripción", () => {
    const ids = new Set(SHOWROOM_PHOTOS.map((p) => p.id));
    expect(ids.size).toBe(SHOWROOM_PHOTOS.length);
    const cats = new Set<string>(SHOWROOM_CATEGORIES.map((c) => c.id));
    for (const p of SHOWROOM_PHOTOS) {
      expect(cats.has(p.category)).toBe(true);
      expect(p.title.length).toBeGreaterThan(5);
      expect(p.description.length).toBeGreaterThan(10);
    }
  });
  it("cada categoría tiene al menos una foto", () => {
    for (const c of SHOWROOM_CATEGORIES) expect(SHOWROOM_PHOTOS.some((p) => p.category === c.id)).toBe(true);
  });
});
