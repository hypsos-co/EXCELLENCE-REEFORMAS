import { describe, expect, it } from "vitest";
import { displayName, sniffImage } from "@/lib/server/files";
import { fakeJpeg } from "./fixtures";

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

describe("sniffImage", () => {
  it("detecta JPEG, PNG, WEBP y HEIC por su firma", () => {
    expect(sniffImage(fakeJpeg())?.mime).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))?.mime).toBe("image/png");
    expect(sniffImage(new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")]))?.mime).toBe("image/webp");
    expect(sniffImage(new Uint8Array([0, 0, 0, 0x18, ...ascii("ftypheic")]))?.mime).toBe("image/heic");
  });
  it("rechaza archivos que no son imágenes aunque se llamen .jpg", () => {
    expect(sniffImage(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0]))).toBeNull(); // PDF
  });
  it("limpia nombres de archivo", () => {
    expect(displayName("../../etc/passwd")).toBe("passwd");
    expect(displayName("C:\\fotos\\mi baño<1>.jpg")).toBe("mi baño_1_.jpg");
  });
});
