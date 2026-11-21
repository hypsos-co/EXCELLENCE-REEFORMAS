import type { ReviewStore } from "@/lib/netlify/reviews-store";
import { moderationUrl, signAction, summarize, verifyAction, type PublicReview } from "./public";

/** Respuestas HTTP de las opiniones públicas (las usa la función de Netlify). */

export async function reviewsResponse(store: Pick<ReviewStore, "list">): Promise<Response> {
  const payload = summarize(await store.list());
  return Response.json(payload, {
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
      // La CDN de Netlify la guarda 1 minuto: las nuevas opiniones aparecen enseguida.
      "netlify-cdn-cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

type Action = "ocultar" | "mostrar";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function page(title: string, inner: string, status = 200): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} · Excellence Reformas</title>
<style>
body{margin:0;background:#E9EEF3;font:16px/1.55 Arial,Helvetica,sans-serif;color:#102B49}
main{max-width:560px;margin:40px auto;padding:0 16px}
.card{background:#fff;border-radius:18px;padding:28px;box-shadow:0 8px 24px -12px rgb(16 43 73/.25)}
h1{margin:0 0 10px;font-size:24px}
.review{margin:18px 0;padding:16px;border-left:4px solid #7292B0;background:#F4F7FA;border-radius:0 12px 12px 0}
.stars{color:#F2B01E;font-size:20px;letter-spacing:2px}
button,.btn{display:inline-block;margin-top:8px;padding:13px 22px;border:0;border-radius:999px;background:#102B49;color:#fff;font:700 15px Arial,Helvetica,sans-serif;text-decoration:none;cursor:pointer}
.soft{background:#E9EEF3;color:#102B49}
p.small{font-size:13px;color:#486684}
</style></head><body><main><div class="card">${inner}</div></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function preview(r: PublicReview) {
  return `<div class="review"><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
  ${r.text ? `<p>«${esc(r.text)}»</p>` : ""}<strong>${esc(r.name)}</strong></div>`;
}

const invalid = () => page("Enlace no válido", `<h1>Enlace no válido</h1><p>Este enlace no es correcto o ha caducado. Usa el botón del email original.</p>`, 403);

async function readParams(req: Request) {
  if (req.method === "POST") {
    const fd = await req.formData().catch(() => null);
    return { id: String(fd?.get("id") ?? ""), action: String(fd?.get("accion") ?? ""), sig: String(fd?.get("firma") ?? "") };
  }
  const u = new URL(req.url);
  return { id: u.searchParams.get("id") ?? "", action: u.searchParams.get("accion") ?? "", sig: u.searchParams.get("firma") ?? "" };
}

/**
 * Moderación desde el email de Julio César. El enlace (GET) solo muestra una
 * confirmación; el cambio se aplica al pulsar el botón (POST). Así, los
 * antivirus que abren los enlaces de los emails no ocultan nada por error.
 */
export async function moderationPage(req: Request, store: ReviewStore): Promise<Response> {
  if (req.method !== "GET" && req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const { id, action, sig } = await readParams(req);
  if (!/^[a-f0-9]{6,40}$/.test(id) || (action !== "ocultar" && action !== "mostrar") || !sig) return invalid();
  const secret = await store.secret();
  if (!(await verifyAction(secret, id, action as Action, sig))) return invalid();
  const review = await store.get(id);
  if (!review) return page("Opinión no encontrada", `<h1>Opinión no encontrada</h1><p>Puede que ya se haya eliminado.</p>`, 404);

  if (req.method === "GET") {
    const hide = action === "ocultar";
    return page(
      hide ? "Ocultar opinión" : "Mostrar opinión",
      `<h1>${hide ? "¿Ocultar esta opinión de la web?" : "¿Volver a mostrar esta opinión?"}</h1>${preview(review)}
      <form method="post"><input type="hidden" name="id" value="${esc(id)}"><input type="hidden" name="accion" value="${esc(action)}"><input type="hidden" name="firma" value="${esc(sig)}">
      <button type="submit">${hide ? "Sí, ocultarla" : "Sí, volver a mostrarla"}</button></form>
      ${hide ? `<p class="small">Úsalo solo si contiene spam, insultos o datos personales. Ocultar opiniones reales solo por ser negativas puede considerarse publicidad engañosa.</p>` : ""}`,
    );
  }

  const hidden = action === "ocultar";
  await store.setHidden(id, hidden);
  const back = action === "ocultar" ? "mostrar" : "ocultar";
  const backUrl = moderationUrl(new URL(req.url).origin, id, back, await signAction(secret, id, back));
  return page(
    hidden ? "Opinión ocultada" : "Opinión visible",
    `<h1>${hidden ? "Opinión ocultada" : "Opinión visible de nuevo"}</h1>
    <p>${hidden ? "Ya no aparece en la web (puede tardar hasta un minuto)." : "Vuelve a aparecer en la web (puede tardar hasta un minuto)."}</p>${preview(review)}
    <a class="btn soft" href="${esc(backUrl)}">${hidden ? "Deshacer: volver a mostrarla" : "Ocultarla de nuevo"}</a>`,
  );
}
