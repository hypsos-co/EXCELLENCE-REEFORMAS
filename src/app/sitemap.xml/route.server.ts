import { getSiteUrl } from "@/config/site";
import { sitemapXml } from "@/lib/seo";

// Versión con servidor. En la versión HTML (Netlify) lo genera scripts/build-netlify.mjs.
export function GET() {
  return new Response(sitemapXml(getSiteUrl().origin), { headers: { "content-type": "application/xml; charset=utf-8" } });
}
