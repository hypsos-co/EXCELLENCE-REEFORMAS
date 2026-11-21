import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalStorage, S3Storage } from "@/lib/server/storage";
import { RateLimiter } from "@/lib/server/rate-limit";

describe("LocalStorage", () => {
  it("guarda con permisos privados y bloquea rutas fuera de la carpeta", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "er-ls-"));
    const s = new LocalStorage(dir);
    await s.put("solicitudes/a/b.json", "{}", "application/json");
    expect(new TextDecoder().decode((await s.get("solicitudes/a/b.json"))!)).toBe("{}");
    expect((await stat(path.join(dir, "solicitudes/a/b.json"))).mode & 0o777).toBe(0o600);
    expect(await s.get("solicitudes/no-existe.json")).toBeNull();
    await expect(s.put("../fuera.txt", "x", "text/plain")).rejects.toThrow();
    await expect(s.put("/etc/passwd", "x", "text/plain")).rejects.toThrow();
    await rm(dir, { recursive: true, force: true });
  });
});

describe("S3Storage", () => {
  it("firma las peticiones y usa rutas del bucket privado", async () => {
    const calls: Request[] = [];
    const objects = new Map<string, string>();
    const fakeFetch = (async (input: RequestInfo | URL) => {
      const req = input as Request;
      calls.push(req);
      const url = new URL(req.url);
      if (req.method === "PUT") {
        objects.set(url.pathname, await req.text());
        return new Response(null, { status: 200 });
      }
      const body = objects.get(url.pathname);
      return body === undefined ? new Response("NoSuchKey", { status: 404 }) : new Response(body);
    }) as typeof fetch;

    const s3 = new S3Storage(
      {
        driver: "s3",
        endpoint: "https://cuenta.r2.cloudflarestorage.com",
        region: "auto",
        bucket: "solicitudes-privadas",
        accessKeyId: "AKIAEXAMPLE",
        secretAccessKey: "secret",
        forcePathStyle: true,
        prefix: "web",
      },
      fakeFetch,
    );
    await s3.put("solicitudes/2026/11/ER-1/solicitud.json", '{"ok":true}', "application/json");
    expect(calls[0].url).toBe("https://cuenta.r2.cloudflarestorage.com/solicitudes-privadas/web/solicitudes/2026/11/ER-1/solicitud.json");
    expect(calls[0].headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\//);
    expect(calls[0].headers.get("x-amz-content-sha256")).toBeTruthy();
    expect(new TextDecoder().decode((await s3.get("solicitudes/2026/11/ER-1/solicitud.json"))!)).toBe('{"ok":true}');
    expect(await s3.get("solicitudes/otra.json")).toBeNull();
  });
});

describe("RateLimiter", () => {
  it("limita los envíos por IP dentro de la ventana", () => {
    const rl = new RateLimiter(2, 60_000);
    expect(rl.check("1.1.1.1", 0).ok).toBe(true);
    expect(rl.check("1.1.1.1", 1).ok).toBe(true);
    expect(rl.check("1.1.1.1", 2)).toMatchObject({ ok: false });
    expect(rl.check("2.2.2.2", 2).ok).toBe(true);
    expect(rl.check("1.1.1.1", 60_001).ok).toBe(true);
  });
});
