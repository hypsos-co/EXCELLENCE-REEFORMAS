import { FEEDBACK_HIGHLIGHTS, FEEDBACK_STAGES, type Feedback } from "@/lib/forms/feedback";

/**
 * Opiniones publicadas en la web.
 *
 * Solo se publican las valoraciones en las que el cliente marca «Autorizo
 * a publicar mi opinión» (con su nombre e inicial). Se publican TODAS las que
 * lo autorizan, sin modificar el texto; solo se retiran las que contienen spam,
 * insultos o datos personales (enlace «Ocultar» del email que recibe Julio César).
 */

export type PublicReview = {
  id: string;
  /** Nombre e inicial del apellido, p. ej. «María G.». */
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  highlights?: string[];
  stage?: string;
  /** ISO 8601. */
  createdAt: string;
  hidden?: boolean;
};

export type ReviewsPayload = { reviews: PublicReview[]; count: number; average: number | null };

const MAX_TEXT = 900;

/** «maría garcía lópez» → «María G.» */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Cliente";
  const cap = (w: string) => w.charAt(0).toLocaleUpperCase("es-ES") + w.slice(1).toLocaleLowerCase("es-ES");
  const first = cap(parts[0]);
  const initial = parts[1] ? ` ${parts[1].charAt(0).toLocaleUpperCase("es-ES")}.` : "";
  return `${first}${initial}`.slice(0, 40);
}

/** Quita emails, teléfonos y enlaces del texto público (datos personales y spam). */
export function cleanPublicText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/\+?\d[\d\s.-]{7,}\d/g, (m) => (m.replace(/\D/g, "").length >= 9 ? "[teléfono]" : m))
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[enlace]")
    .trim()
    .slice(0, MAX_TEXT);
}

export function canPublish(f: Pick<Feedback, "publish" | "name">): boolean {
  return f.publish && !!f.name?.trim();
}

export function toPublicReview(f: Feedback, id: string, now: Date): PublicReview {
  const text = f.comment ? cleanPublicText(f.comment) : "";
  return {
    id,
    name: publicName(f.name ?? ""),
    rating: f.rating as PublicReview["rating"],
    ...(text ? { text } : {}),
    ...(f.highlights.length ? { highlights: f.highlights.map((h) => FEEDBACK_HIGHLIGHTS.find((o) => o.id === h)?.label ?? h) } : {}),
    ...(f.stage ? { stage: FEEDBACK_STAGES.find((o) => o.id === f.stage)?.label } : {}),
    createdAt: now.toISOString(),
  };
}

export function summarize(list: PublicReview[]): ReviewsPayload {
  const visible = list.filter((r) => !r.hidden).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = visible.length ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10 : null;
  return { reviews: visible, count: visible.length, average };
}

/** Identificador corto y aleatorio. */
export function newReviewId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------- Firma del enlace «Ocultar» ---------------------- */

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function signAction(secret: string, id: string, action: "ocultar" | "mostrar"): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(`${action}:${id}`));
  return b64url(sig).slice(0, 32);
}

export async function verifyAction(secret: string, id: string, action: "ocultar" | "mostrar", signature: string): Promise<boolean> {
  const expected = await signAction(secret, id, action);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export function moderationUrl(siteUrl: string, id: string, action: "ocultar" | "mostrar", signature: string): string {
  const u = new URL("/api/opiniones/moderar", siteUrl);
  u.searchParams.set("id", id);
  u.searchParams.set("accion", action);
  u.searchParams.set("firma", signature);
  return u.toString();
}
