import { siteConfig } from "./site";

/**
 * OPINIONES DE CLIENTES
 * ---------------------------------------------------------------------------
 * Añade aquí SOLO opiniones reales, con permiso del cliente para publicarlas.
 * Publicar reseñas inventadas es una práctica desleal prohibida por la
 * normativa de consumo (Real Decreto-ley 24/2021) y puede acarrear sanciones.
 *
 * Mientras la lista esté vacía, la sección de opiniones no se muestra.
 *
 * Ejemplo de una opinión real:
 *   {
 *     name: "María G.",            // nombre e inicial (con su permiso)
 *     locality: "Alcobendas",
 *     project: "Reforma de baño",
 *     date: "2026-10",             // año-mes
 *     rating: 5,                   // 1 a 5
 *     text: "Lo que escribió el cliente, sin modificar.",
 *     source: "Google",            // Google, WhatsApp, email…
 *   },
 */

export type Review = {
  name: string;
  locality?: string;
  project?: string;
  date?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  source?: string;
};

export const reviews: Review[] = [];

/** Enlace para dejar opinión en Google: se configura en src/config/site.ts → social.googleReviews. */
export const reviewLinkUrl: string = siteConfig.social.googleReviews;
