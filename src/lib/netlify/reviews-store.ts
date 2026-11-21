import { getStore } from "@netlify/blobs";
import type { PublicReview } from "@/lib/reviews/public";

/**
 * Opiniones guardadas de forma permanente en Netlify Blobs (almacén
 * «opiniones» del propio proyecto de Netlify; no necesita claves).
 * Cada opinión es un objeto JSON en `r/<id>`. La clave para firmar los
 * enlaces de moderación se genera sola la primera vez y se guarda en `config/firma`.
 */

export type ReviewStore = {
  save(review: PublicReview): Promise<void>;
  get(id: string): Promise<PublicReview | null>;
  list(): Promise<PublicReview[]>;
  setHidden(id: string, hidden: boolean): Promise<PublicReview | null>;
  secret(): Promise<string>;
};

export function netlifyReviewStore(): ReviewStore {
  const store = getStore({ name: "opiniones", consistency: "strong" });
  return {
    async save(review) {
      await store.setJSON(`r/${review.id}`, review);
    },
    async get(id) {
      return (await store.get(`r/${id}`, { type: "json" })) as PublicReview | null;
    },
    async list() {
      const { blobs } = await store.list({ prefix: "r/" });
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<PublicReview | null>));
      return items.filter((r): r is PublicReview => !!r && typeof r.id === "string");
    },
    async setHidden(id, hidden) {
      const key = `r/${id}`;
      const current = (await store.get(key, { type: "json" })) as PublicReview | null;
      if (!current) return null;
      const next = { ...current, hidden };
      await store.setJSON(key, next);
      return next;
    },
    async secret() {
      const existing = await store.get("config/firma", { type: "text" });
      if (existing) return existing;
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const value = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      await store.set("config/firma", value, { onlyIfNew: true });
      // Si otra ejecución la creó a la vez, gana la que quedó guardada.
      return (await store.get("config/firma", { type: "text" })) ?? value;
    },
  };
}
