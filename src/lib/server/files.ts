/**
 * Detección del tipo real de una imagen por su firma binaria («magic bytes»).
 * No se confía en el tipo MIME ni en la extensión que envía el navegador.
 */

export type ImageKind = { mime: string; ext: string };

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const b = bytes;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (start: number, end: number) => String.fromCharCode(...b.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (["heic", "heix", "hevc", "hevx", "heim", "heis"].includes(brand)) return { mime: "image/heic", ext: "heic" };
    if (["mif1", "msf1"].includes(brand)) return { mime: "image/heif", ext: "heif" };
  }
  return null;
}

/** Nombre de archivo original limpio, solo para mostrarlo (nunca se usa como ruta). */
export function displayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "foto";
  return base.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 80) || "foto";
}
