/**
 * Cargador de imágenes para la versión HTML estática (Netlify).
 * Al compilar, `scripts/export-images.mjs` genera versiones WebP de cada foto
 * en los anchos configurados en next.config.ts (foto.w640.webp, foto.w1280.webp…)
 * y este cargador apunta a ellas. Así la web estática sirve imágenes ligeras
 * sin necesitar un servidor de optimización.
 */
export default function exportImageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (process.env.NODE_ENV !== "production" || !src.startsWith("/_next/static/media/")) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }
  return src.replace(/\.(jpe?g|png)$/i, `.w${width}.webp`);
}
