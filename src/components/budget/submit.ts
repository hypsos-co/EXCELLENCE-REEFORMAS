import { siteConfig } from "@/config/site";
import { NETLIFY_POST_PATH, buildNetlifyFormData } from "@/lib/budget/netlify-form";
import { makeReference } from "@/lib/budget/reference";
import type { PhotoItem } from "./photos";
import { stepForField, toPayload, type Draft, type StepId } from "./state";

/**
 * Destino del envío, fijado al compilar:
 *  - "netlify": versión HTML estática en Netlify → Netlify Forms.
 *  - "api" (por defecto): servidor Next.js propio → POST /api/solicitudes.
 */
export const SUBMIT_TARGET: "netlify" | "api" = process.env.NEXT_PUBLIC_SUBMIT_TARGET === "netlify" ? "netlify" : "api";

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; steps?: StepId[] };

type SubmitInput = {
  draft: Draft;
  photos: PhotoItem[];
  honeypot: string;
  startedAt: number;
  idempotencyKey: string;
};

const NETWORK_ERROR = "No hemos podido conectar con el servidor. Revisa tu conexión a internet y vuelve a intentarlo.";

export async function submitBudgetRequest(input: SubmitInput): Promise<SubmitResult> {
  return SUBMIT_TARGET === "netlify" ? submitToNetlify(input) : submitToApi(input);
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = 60_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

const readyFiles = (photos: PhotoItem[]) => photos.filter((p) => p.status === "ready" && p.file).map((p) => p.file!);

/* ------------------------------ Netlify Forms ----------------------------- */

async function submitToNetlify({ draft, photos, honeypot }: SubmitInput): Promise<SubmitResult> {
  const reference = makeReference(new Date());
  const body = buildNetlifyFormData(
    { ...draft, location: { ...draft.location, postalCode: draft.location.postalCode } },
    { reference, photos: readyFiles(photos), honeypot, privacyVersion: siteConfig.legal.privacyPolicyVersion },
  );
  try {
    // Sin cabecera Content-Type: el navegador la pone con el «boundary» del multipart.
    const res = await withTimeout((signal) => fetch(NETLIFY_POST_PATH, { method: "POST", body, signal }));
    if (res.ok) return { ok: true, reference };
    if (res.status === 413) return { ok: false, message: "Las fotografías ocupan demasiado. Elimina alguna e inténtalo de nuevo." };
    return {
      ok: false,
      message:
        res.status === 404
          ? "El sistema de solicitudes todavía no está activo. Por favor, contacta con nosotros por otro medio."
          : "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.",
    };
  } catch {
    return { ok: false, message: NETWORK_ERROR };
  }
}

/* ---------------------------- Servidor propio ----------------------------- */

async function submitToApi({ draft, photos, honeypot, startedAt, idempotencyKey }: SubmitInput): Promise<SubmitResult> {
  const form = new FormData();
  form.append("data", JSON.stringify(toPayload(draft)));
  form.append("startedAt", String(startedAt));
  form.append("website", honeypot);
  readyFiles(photos).forEach((f) => form.append("fotos", f, f.name));
  try {
    const res = await withTimeout((signal) =>
      fetch("/api/solicitudes", { method: "POST", body: form, headers: { "Idempotency-Key": idempotencyKey }, signal }),
    );
    const body = (await res.json().catch(() => null)) as
      | { ok: true; reference: string }
      | { ok: false; code?: string; message?: string; fieldErrors?: Record<string, string> }
      | null;
    if (res.ok && body?.ok) return { ok: true, reference: body.reference };
    const failure = body && !body.ok ? body : null;
    const fieldErrors = failure?.fieldErrors;
    const steps = fieldErrors ? [...new Set(Object.keys(fieldErrors).map(stepForField))] : undefined;
    let message = failure?.message ?? "No hemos podido enviar tu solicitud. Inténtalo de nuevo.";
    if (res.status === 413) message = "Las fotografías ocupan demasiado. Elimina alguna e inténtalo de nuevo.";
    if (res.status >= 500 && !failure?.message) message = "Ha habido un problema en nuestro servidor. Inténtalo de nuevo en unos minutos.";
    return { ok: false, message, fieldErrors, steps };
  } catch {
    return { ok: false, message: NETWORK_ERROR };
  }
}
