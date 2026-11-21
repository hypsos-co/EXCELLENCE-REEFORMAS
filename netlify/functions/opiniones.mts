import type { Config } from "@netlify/functions";
import { netlifyReviewStore } from "../../src/lib/netlify/reviews-store";
import { moderationPage, reviewsResponse } from "../../src/lib/reviews/http";

/**
 * Opiniones públicas de la web.
 *   GET  /api/opiniones          → JSON con las opiniones publicadas, la media y el total.
 *   GET  /api/opiniones/moderar  → página para confirmar «Ocultar» / «Volver a mostrar»
 *   POST /api/opiniones/moderar  → aplica el cambio (enlace firmado del email de Julio César).
 */
export default async function opiniones(req: Request): Promise<Response> {
  const store = netlifyReviewStore();
  const url = new URL(req.url);
  if (url.pathname.endsWith("/moderar")) return moderationPage(req, store);
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método no permitido", { status: 405 });
  return reviewsResponse(store);
}

export const config: Config = { path: ["/api/opiniones", "/api/opiniones/moderar"] };
