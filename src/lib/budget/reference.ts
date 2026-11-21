/** Referencia legible de cada solicitud (compartida por navegador y servidor). */

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O/1/I

/** Referencia legible: ER-AAMMDD-XXXX (fecha en hora de Madrid). */
export function makeReference(date: Date, random: Uint8Array = crypto.getRandomValues(new Uint8Array(4))): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const suffix = Array.from(random, (n) => ALPHABET[n % ALPHABET.length]).join("");
  return `ER-${get("year")}${get("month")}${get("day")}-${suffix}`;
}
