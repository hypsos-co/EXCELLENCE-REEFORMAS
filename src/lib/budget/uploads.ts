/**
 * Límites de las fotografías adjuntas. Se aplican en el navegador (para avisar
 * al usuario) y en el servidor (que vuelve a comprobarlos siempre).
 *
 * El total se mantiene por debajo de 4,5 MB porque es el límite de cuerpo de
 * petición de las funciones de Vercel. El asistente comprime las fotos en el
 * navegador antes de enviarlas, así que lo normal es que cada una ocupe
 * 300-700 KB.
 */
export const UPLOAD_LIMITS = {
  maxFiles: 6,
  /** Tamaño máximo de la foto original que el usuario puede elegir. */
  maxOriginalBytes: 25 * 1024 * 1024,
  /** Tamaño máximo de cada foto tal como llega al servidor. */
  maxFileBytes: 4 * 1024 * 1024,
  /** Tamaño máximo de todas las fotos juntas tal como llegan al servidor. */
  maxTotalBytes: 4 * 1024 * 1024,
  /** Compresión en el navegador. */
  compress: { maxDimension: 1920, quality: 0.8, fallbackDimension: 1440, fallbackQuality: 0.7, targetBytes: 900 * 1024 },
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  acceptAttribute: "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif",
} as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
