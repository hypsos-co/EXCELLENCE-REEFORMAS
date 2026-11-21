/** Páginas públicas (para sitemap.xml). Mantener en sincronía con scripts/build-netlify.mjs. */
export const PUBLIC_PAGES = ["/", "/showroom", "/solicitar-presupuesto", "/clientes", "/valoracion", "/politica-de-privacidad"] as const;

export function robotsTxt(base: string | null): string {
  return `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /__forms.html\n${base ? `\nSitemap: ${base}/sitemap.xml\n` : ""}`;
}

export function sitemapXml(base: string): string {
  const urls = PUBLIC_PAGES.map((p) => `  <url><loc>${base}${p}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
