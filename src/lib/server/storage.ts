import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";
import type { StorageConfig } from "./env";

/**
 * Almacenamiento privado de solicitudes y fotografías.
 *
 * - `local`: carpeta del servidor fuera de /public (por defecto `.data/`).
 *   Útil en desarrollo o en un servidor propio con disco persistente.
 * - `s3`: cualquier bucket compatible con S3 (AWS S3, Cloudflare R2,
 *   Backblaze B2, MinIO…). El bucket debe ser PRIVADO: las fotos nunca se
 *   publican con enlaces abiertos.
 */
export interface Storage {
  readonly name: string;
  put(key: string, body: Uint8Array | string, contentType: string): Promise<void>;
  /** Devuelve null si el objeto no existe. */
  get(key: string): Promise<Uint8Array | null>;
}

export class StorageError extends Error {}

function assertSafeKey(key: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(key) || key.includes("..") || key.includes("//")) {
    throw new StorageError(`Clave de almacenamiento no válida: ${key}`);
  }
}

export class LocalStorage implements Storage {
  readonly name = "local";
  constructor(private readonly root: string) {}

  private resolve(key: string) {
    assertSafeKey(key);
    const full = path.resolve(/*turbopackIgnore: true*/ this.root, key);
    if (!full.startsWith(path.resolve(/*turbopackIgnore: true*/ this.root) + path.sep)) throw new StorageError("Ruta fuera del almacenamiento");
    return full;
  }

  // El tipo de contenido no hace falta en disco (se deduce de la extensión).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async put(key: string, body: Uint8Array | string, _contentType?: string): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(/*turbopackIgnore: true*/ full), { recursive: true, mode: 0o700 });
    const tmp = `${full}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, body, { mode: 0o600 });
    await fs.rename(tmp, full);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await fs.readFile(this.resolve(key)));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }
}

export class S3Storage implements Storage {
  readonly name = "s3";
  private readonly client: AwsClient;

  constructor(
    private readonly cfg: Extract<StorageConfig, { driver: "s3" }>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      region: cfg.region,
      service: "s3",
    });
  }

  url(key: string): string {
    assertSafeKey(key);
    const fullKey = (this.cfg.prefix ? `${this.cfg.prefix}/${key}` : key).split("/").map(encodeURIComponent).join("/");
    const endpoint = new URL(this.cfg.endpoint);
    if (this.cfg.forcePathStyle) return `${endpoint.origin}/${encodeURIComponent(this.cfg.bucket)}/${fullKey}`;
    return `${endpoint.protocol}//${this.cfg.bucket}.${endpoint.host}/${fullKey}`;
  }

  private async send(method: "PUT" | "GET", key: string, init: RequestInit = {}) {
    const signed = await this.client.sign(this.url(key), { method, ...init });
    return this.fetchImpl(signed);
  }

  async put(key: string, body: Uint8Array | string, contentType: string): Promise<void> {
    const res = await this.send("PUT", key, {
      body: typeof body === "string" ? body : new Blob([body as BlobPart]),
      headers: { "content-type": contentType },
    });
    if (!res.ok) throw new StorageError(`S3 PUT ${key} → ${res.status} ${await safeText(res)}`);
  }

  async get(key: string): Promise<Uint8Array | null> {
    const res = await this.send("GET", key);
    if (res.status === 404) return null;
    if (!res.ok) throw new StorageError(`S3 GET ${key} → ${res.status} ${await safeText(res)}`);
    return new Uint8Array(await res.arrayBuffer());
  }
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}

export function createStorage(cfg: StorageConfig): Storage {
  return cfg.driver === "local" ? new LocalStorage(cfg.dataDir) : new S3Storage(cfg);
}

export async function putJson(storage: Storage, key: string, value: unknown) {
  await storage.put(key, JSON.stringify(value, null, 2), "application/json; charset=utf-8");
}

export async function getJson<T>(storage: Storage, key: string): Promise<T | null> {
  const raw = await storage.get(key);
  return raw ? (JSON.parse(new TextDecoder().decode(raw)) as T) : null;
}
