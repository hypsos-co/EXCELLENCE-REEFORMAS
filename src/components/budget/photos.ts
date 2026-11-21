import { UPLOAD_LIMITS, formatBytes } from "@/lib/budget/uploads";

export type PhotoItem = {
  id: string;
  originalName: string;
  status: "processing" | "ready" | "error";
  file?: File;
  previewUrl?: string;
  size?: number;
  error?: string;
};

const EXT = /\.(jpe?g|png|webp|heic|heif)$/i;

export function isAcceptedType(file: File): boolean {
  return (UPLOAD_LIMITS.acceptedMimeTypes as readonly string[]).includes(file.type) || EXT.test(file.name);
}

function isHeic(file: File) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function toJpeg(bitmap: ImageBitmap, maxDim: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff"; // PNG con transparencia → fondo blanco
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Prepara una foto para el envío: la reduce a JPEG en el navegador
 * (elimina además los metadatos EXIF, como la ubicación GPS).
 */
export async function preparePhoto(file: File): Promise<{ file: File; previewUrl?: string } | { error: string }> {
  if (!isAcceptedType(file)) return { error: "Formato no admitido. Usa fotos JPG, PNG, WEBP o HEIC." };
  if (file.size > UPLOAD_LIMITS.maxOriginalBytes) {
    return { error: `La foto pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(UPLOAD_LIMITS.maxOriginalBytes)}.` };
  }
  const { compress } = UPLOAD_LIMITS;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = null;
  }
  if (bitmap) {
    try {
      let blob = await toJpeg(bitmap, compress.maxDimension, compress.quality);
      if (blob && blob.size > compress.targetBytes) {
        blob = (await toJpeg(bitmap, compress.fallbackDimension, compress.fallbackQuality)) ?? blob;
      }
      if (blob) {
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        const out = new File([blob], name, { type: "image/jpeg" });
        return { file: out, previewUrl: URL.createObjectURL(out) };
      }
    } finally {
      bitmap.close();
    }
  }
  // El navegador no puede decodificarla (p. ej. HEIC fuera de Safari): se envía tal cual si cabe.
  if (isHeic(file) && file.size <= UPLOAD_LIMITS.maxFileBytes) return { file };
  return {
    error: isHeic(file)
      ? "Esta foto HEIC es demasiado pesada. Prueba a enviarla en JPG o hazle una captura de pantalla."
      : "No hemos podido leer esta imagen. Prueba con otra foto.",
  };
}
