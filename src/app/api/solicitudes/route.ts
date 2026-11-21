import type { NextRequest } from "next/server";
import { UPLOAD_LIMITS } from "@/lib/budget/uploads";
import { getServerConfig } from "@/lib/server/env";
import { RateLimiter, clientIp } from "@/lib/server/rate-limit";
import { createStorage } from "@/lib/server/storage";
import { submitBudgetRequest, type IncomingPhoto } from "@/lib/server/submissions";

/**
 * POST /api/solicitudes
 * Recibe una solicitud de EXCELLENCE SMART BUDGET (multipart/form-data):
 *   - data:      JSON con las respuestas del asistente
 *   - fotos:     0..6 imágenes
 *   - startedAt: marca de tiempo del inicio del asistente (anti-bots)
 *   - website:   campo trampa que las personas no ven (anti-bots)
 * Cabecera Idempotency-Key: UUID por envío, para evitar duplicados al reintentar.
 */

export const maxDuration = 30;

let limiter: RateLimiter | null = null;

const json = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

function originAllowed(request: NextRequest, allowed: string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // peticiones del mismo origen sin cabecera Origin
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  if (allowed.includes(originUrl.origin)) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return !!host && originUrl.host === host;
}

export async function POST(request: NextRequest) {
  const cfg = getServerConfig();

  if (!originAllowed(request, cfg.allowedOrigins)) {
    return json(403, { ok: false, code: "forbidden", message: "Origen no permitido." });
  }

  if (cfg.storage.driver === "unconfigured" || (cfg.requireEmail && cfg.email.mode === "unconfigured")) {
    console.error(
      "[solicitudes] Recepción de solicitudes sin configurar:",
      cfg.storage.driver === "unconfigured" ? cfg.storage.reason : "",
      cfg.email.mode === "unconfigured" ? cfg.email.reason : "",
    );
    return json(503, {
      ok: false,
      code: "not_configured",
      message: "El sistema de solicitudes todavía no está activo. Por favor, contacta con nosotros por otro medio.",
    });
  }

  limiter ??= new RateLimiter(cfg.rateLimit.max, cfg.rateLimit.windowMs);
  const rl = limiter.check(clientIp(request.headers));
  if (!rl.ok) {
    return json(
      429,
      { ok: false, code: "rate_limited", message: "Has hecho varios envíos seguidos. Espera unos minutos y vuelve a intentarlo." },
      { "retry-after": String(rl.retryAfter) },
    );
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > UPLOAD_LIMITS.maxTotalBytes + 256 * 1024) {
    return json(413, { ok: false, code: "too_large", message: "Las fotografías ocupan demasiado. Prueba con menos fotos." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, code: "bad_request", message: "No hemos podido leer la solicitud." });
  }

  // Protección anti-bots: campo trampa y tiempo mínimo para completar el asistente.
  const honeypot = String(form.get("website") ?? "");
  const startedAt = Number(form.get("startedAt") ?? 0);
  if (honeypot || !startedAt || Date.now() - startedAt < 3000) {
    return json(400, { ok: false, code: "rejected", message: "No hemos podido validar el envío. Recarga la página e inténtalo de nuevo." });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return json(400, { ok: false, code: "bad_request", message: "No hemos podido leer la solicitud." });
  }

  const photos: IncomingPhoto[] = [];
  for (const entry of form.getAll("fotos")) {
    if (typeof entry === "string") continue;
    photos.push({ name: entry.name, bytes: new Uint8Array(await entry.arrayBuffer()) });
  }

  const result = await submitBudgetRequest(
    {
      storage: createStorage(cfg.storage),
      // Sin SMTP (y sin exigir email) se guarda una vista previa del aviso junto a la solicitud.
      email: cfg.email.mode === "unconfigured" ? { mode: "preview" } : cfg.email,
      requireEmail: cfg.requireEmail,
    },
    { raw, photos, idempotencyKey: request.headers.get("idempotency-key") ?? "" },
  );

  if (result.ok) {
    return json(result.status, { ok: true, reference: result.reference, duplicate: result.duplicate });
  }
  return json(result.status, { ok: false, code: result.code, message: result.message, fieldErrors: result.fieldErrors });
}
