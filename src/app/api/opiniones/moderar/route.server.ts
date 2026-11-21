import { connection, type NextRequest } from "next/server";
import { moderationPage } from "@/lib/reviews/http";
import { getServerConfig } from "@/lib/server/env";
import { storageReviewStore } from "@/lib/server/reviews";
import { createStorage } from "@/lib/server/storage";

/** Confirmar y aplicar «Ocultar» / «Volver a mostrar» desde el email (versión con servidor). */
async function handle(request: NextRequest) {
  await connection();
  const cfg = getServerConfig();
  if (cfg.storage.driver === "unconfigured") return new Response("No disponible", { status: 503 });
  return moderationPage(request, storageReviewStore(createStorage(cfg.storage)));
}

export const GET = handle;
export const POST = handle;
