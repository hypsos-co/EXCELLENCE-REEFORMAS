import { SUBMIT_TARGET } from "@/components/budget/submit";

/** Envío de los formularios del área de clientes (valoración y posventa). */
export type CareFormName = "valoracion" | "posventa";
export type CareSubmitResult = { ok: true } | { ok: false; message: string };

const NETWORK_ERROR = "No hemos podido conectar. Revisa tu conexión a internet y vuelve a intentarlo.";

export async function submitCareForm(opts: {
  form: CareFormName;
  fields: Record<string, string>;
  payload: unknown;
  files?: File[];
  honeypot: string;
}): Promise<CareSubmitResult> {
  const files = opts.files ?? [];
  const fd = new FormData();
  let url: string;
  if (SUBMIT_TARGET === "netlify") {
    url = "/__forms.html";
    fd.append("form-name", opts.form);
    for (const [k, v] of Object.entries(opts.fields)) fd.append(k, k === "bot-field" ? opts.honeypot : v);
    files.forEach((f, i) => fd.append(`foto_${i + 1}`, f, f.name));
  } else {
    url = "/api/formularios";
    fd.append("formulario", opts.form);
    fd.append("datos_json", JSON.stringify(opts.payload));
    fd.append("website", opts.honeypot);
    files.forEach((f) => fd.append("fotos", f, f.name));
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(url, { method: "POST", body: fd, signal: controller.signal }).finally(() => clearTimeout(timer));
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (res.status === 404 || res.status === 503) {
      return { ok: false, message: "Este formulario todavía no está activo. Escríbenos por WhatsApp o llámanos, por favor." };
    }
    return { ok: false, message: body?.message ?? "No hemos podido enviar el formulario. Inténtalo de nuevo en unos minutos." };
  } catch {
    return { ok: false, message: NETWORK_ERROR };
  }
}
