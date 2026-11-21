import { getSiteUrl, hasPublicSiteUrl } from "@/config/site";
import { robotsTxt } from "@/lib/seo";

// Versión con servidor. En la versión HTML (Netlify) lo genera scripts/build-netlify.mjs.
export function GET() {
  const base = hasPublicSiteUrl() ? getSiteUrl().origin : null;
  return new Response(robotsTxt(base), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
