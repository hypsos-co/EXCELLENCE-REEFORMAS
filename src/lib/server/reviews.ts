import { randomBytes } from "node:crypto";
import type { ReviewStore } from "@/lib/netlify/reviews-store";
import type { PublicReview } from "@/lib/reviews/public";
import { getJson, putJson, type Storage } from "./storage";

/**
 * Opiniones públicas en la versión con servidor: un índice JSON en el mismo
 * almacenamiento privado que las solicitudes (`indices/opiniones.json`).
 */
const INDEX = "indices/opiniones.json";
const SECRET = "indices/opiniones-firma.txt";

export function storageReviewStore(storage: Storage): ReviewStore {
  const read = async () => (await getJson<PublicReview[]>(storage, INDEX)) ?? [];
  return {
    async save(review) {
      const list = await read();
      await putJson(storage, INDEX, [...list.filter((r) => r.id !== review.id), review]);
    },
    async get(id) {
      return (await read()).find((r) => r.id === id) ?? null;
    },
    list: read,
    async setHidden(id, hidden) {
      const list = await read();
      const i = list.findIndex((r) => r.id === id);
      if (i < 0) return null;
      list[i] = { ...list[i], hidden };
      await putJson(storage, INDEX, list);
      return list[i];
    },
    async secret() {
      const raw = await storage.get(SECRET);
      if (raw) return new TextDecoder().decode(raw);
      const value = randomBytes(32).toString("hex");
      await storage.put(SECRET, value, "text/plain");
      return value;
    },
  };
}
