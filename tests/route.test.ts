import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/solicitudes/route";
import { fakeJpeg, validRequest } from "./fixtures";

let dir: string;
const saved = { ...process.env };

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "er-route-"));
  Object.assign(process.env, { STORAGE_DRIVER: "local", DATA_DIR: dir, RATE_LIMIT_MAX: "100" });
  delete process.env.SMTP_HOST;
});
afterAll(async () => {
  process.env = saved;
  await rm(dir, { recursive: true, force: true });
});

function request({
  data = validRequest() as unknown,
  startedAt = Date.now() - 60_000,
  website = "",
  origin = "http://localhost:3000",
  photos = [] as Uint8Array[],
  key = crypto.randomUUID(),
} = {}) {
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  form.append("startedAt", String(startedAt));
  form.append("website", website);
  photos.forEach((p, i) => form.append("fotos", new File([p as BlobPart], `foto-${i}.jpg`, { type: "image/jpeg" })));
  return new Request("http://localhost:3000/api/solicitudes", {
    method: "POST",
    body: form,
    headers: { origin, host: "localhost:3000", "idempotency-key": key, "x-forwarded-for": "203.0.113.7" },
  }) as unknown as NextRequest;
}

describe("POST /api/solicitudes", () => {
  it("registra una solicitud válida y devuelve la referencia", async () => {
    const res = await POST(request({ photos: [fakeJpeg()] }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body).toMatchObject({ ok: true, duplicate: false });
    expect(body.reference).toMatch(/^ER-/);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("rechaza peticiones desde otro origen", async () => {
    const res = await POST(request({ origin: "https://sitio-malicioso.example" }));
    expect(res.status).toBe(403);
  });

  it("rechaza bots: campo trampa relleno o envío demasiado rápido", async () => {
    expect((await POST(request({ website: "http://spam.example" }))).status).toBe(400);
    expect((await POST(request({ startedAt: Date.now() }))).status).toBe(400);
  });

  it("devuelve los errores de validación por campo", async () => {
    const res = await POST(request({ data: validRequest({ contact: { name: "", phone: "1", email: "x" } }) }));
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(Object.keys(body.fieldErrors)).toEqual(expect.arrayContaining(["contact.name", "contact.phone", "contact.email"]));
  });

  it("no finge éxito si la recepción no está configurada", async () => {
    process.env.STORAGE_DRIVER = "s3"; // sin credenciales S3
    const res = await POST(request());
    process.env.STORAGE_DRIVER = "local";
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, code: "not_configured" });
  });
});
