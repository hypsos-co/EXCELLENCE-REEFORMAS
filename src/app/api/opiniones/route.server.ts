import { connection } from "next/server";
import { reviewsResponse } from "@/lib/reviews/http";
import { getServerConfig } from "@/lib/server/env";
import { storageReviewStore } from "@/lib/server/reviews";
import { createStorage } from "@/lib/server/storage";

/** GET /api/opiniones (versión con servidor). En Netlify lo sirve netlify/functions/opiniones.mts. */
export async function GET() {
  await connection();
  const cfg = getServerConfig();
  if (cfg.storage.driver === "unconfigured") return Response.json({ reviews: [], count: 0, average: null });
  return reviewsResponse(storageReviewStore(createStorage(cfg.storage)));
}
