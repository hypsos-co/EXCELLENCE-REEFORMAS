/**
 * Enlace wa.me con un mensaje personalizado para continuar la conversación
 * después de enviar la solicitud.
 */

export type WhatsAppMessageInput = {
  name: string;
  reform: string;
  locality: string;
  description?: string;
  reference?: string;
};

const MAX_DESCRIPTION = 400;

export function buildWhatsAppMessage({ name, reform, locality, description, reference }: WhatsAppMessageInput): string {
  const lines = [
    `Hola, soy ${name.trim()}. Acabo de enviar una solicitud de presupuesto desde vuestra web${reference ? ` (ref. ${reference})` : ""}.`,
    "",
    `Tipo de reforma: ${reform}`,
    `Localidad: ${locality.trim()}`,
  ];
  const text = description?.replace(/\s+/g, " ").trim();
  if (text) {
    const short = text.length > MAX_DESCRIPTION ? `${text.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…` : text;
    lines.push(`Descripción: ${short}`);
  }
  lines.push("", "Me gustaría hablar con vosotros sobre mi proyecto.");
  return lines.join("\n");
}

/** `number` en formato internacional solo con dígitos, p. ej. "34600000000". */
export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
