import { siteConfig } from "@/config/site";

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const KNOWN = new Set(siteConfig.serviceArea.localities.map(normalizeText));

/**
 * «habitual» si la localidad está en la zona de servicio configurada.
 * «fuera» no implica rechazo: la solicitud se envía igualmente y se marca
 * para que Julio César la valore.
 */
export function serviceZone(location: { locality: string; province: string }): "habitual" | "fuera" {
  const provinces: readonly string[] = siteConfig.serviceArea.provinces;
  if (!provinces.includes(location.province)) return "fuera";
  return KNOWN.has(normalizeText(location.locality)) ? "habitual" : "fuera";
}
