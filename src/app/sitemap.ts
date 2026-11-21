import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["/", "/showroom", "/solicitar-presupuesto", "/politica-de-privacidad"].map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/politica-de-privacidad" ? 0.3 : 0.9,
  }));
}
