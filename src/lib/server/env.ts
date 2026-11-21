import path from "node:path";
import { siteConfig } from "@/config/site";

/**
 * Configuración del servidor leída de variables de entorno.
 * Ninguno de estos valores llega al navegador (no llevan el prefijo NEXT_PUBLIC_).
 */

export type StorageConfig =
  | { driver: "local"; dataDir: string }
  | {
      driver: "s3";
      endpoint: string;
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
      prefix: string;
    };

export type EmailConfig =
  | {
      mode: "smtp";
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      pass?: string;
      from: string;
      to: string[];
    }
  | { mode: "preview" };

export type ServerConfig = {
  storage: StorageConfig | { driver: "unconfigured"; reason: string };
  email: EmailConfig | { mode: "unconfigured"; reason: string };
  /** Si es true, la solicitud no se da por enviada hasta que el email sale. */
  requireEmail: boolean;
  allowedOrigins: string[];
  rateLimit: { max: number; windowMs: number };
};

const isProd = () => process.env.NODE_ENV === "production";
const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined || v === "" ? fallback : ["1", "true", "yes", "si", "sí"].includes(v.toLowerCase());

function readStorage(env: NodeJS.ProcessEnv): ServerConfig["storage"] {
  const driver = (env.STORAGE_DRIVER || (env.VERCEL ? "" : "local")).toLowerCase();
  if (driver === "local") {
    return { driver: "local", dataDir: path.resolve(/*turbopackIgnore: true*/ env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data")) };
  }
  if (driver === "s3") {
    const missing = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !env[k]);
    if (missing.length) return { driver: "unconfigured", reason: `Faltan variables: ${missing.join(", ")}` };
    return {
      driver: "s3",
      endpoint: env.S3_ENDPOINT!.replace(/\/+$/, ""),
      region: env.S3_REGION || "auto",
      bucket: env.S3_BUCKET!,
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      forcePathStyle: bool(env.S3_FORCE_PATH_STYLE, true),
      prefix: (env.S3_PREFIX || "").replace(/^\/+|\/+$/g, ""),
    };
  }
  return {
    driver: "unconfigured",
    reason: env.VERCEL
      ? "En Vercel el disco no es persistente: configura STORAGE_DRIVER=s3."
      : "STORAGE_DRIVER debe ser «local» o «s3».",
  };
}

function readEmail(env: NodeJS.ProcessEnv): ServerConfig["email"] {
  const to = (env.NOTIFY_EMAIL_TO || siteConfig.contact.email || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (env.SMTP_HOST) {
    if (!to.length) return { mode: "unconfigured", reason: "Falta NOTIFY_EMAIL_TO (email empresarial que recibe las solicitudes)." };
    const from = env.MAIL_FROM || env.SMTP_USER;
    if (!from) return { mode: "unconfigured", reason: "Falta MAIL_FROM." };
    const port = Number(env.SMTP_PORT || 587);
    return {
      mode: "smtp",
      host: env.SMTP_HOST,
      port,
      secure: bool(env.SMTP_SECURE, port === 465),
      user: env.SMTP_USER || undefined,
      pass: env.SMTP_PASS || undefined,
      from,
      to,
    };
  }
  if (!isProd() || bool(env.EMAIL_PREVIEW, false)) return { mode: "preview" };
  return { mode: "unconfigured", reason: "Falta la configuración SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, NOTIFY_EMAIL_TO)." };
}

function readOrigins(env: NodeJS.ProcessEnv): string[] {
  const list = new Set<string>();
  if (siteConfig.domain) list.add(new URL(siteConfig.domain).origin);
  for (const o of (env.ALLOWED_ORIGINS || "").split(",")) if (o.trim()) list.add(o.trim().replace(/\/+$/, ""));
  if (env.VERCEL_URL) list.add(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_BRANCH_URL) list.add(`https://${env.VERCEL_BRANCH_URL}`);
  if (env.VERCEL_PROJECT_PRODUCTION_URL) list.add(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return [...list];
}

export function getServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    storage: readStorage(env),
    email: readEmail(env),
    requireEmail: bool(env.REQUIRE_EMAIL_NOTIFICATION, isProd()),
    allowedOrigins: readOrigins(env),
    rateLimit: {
      max: Number(env.RATE_LIMIT_MAX || 5),
      windowMs: Number(env.RATE_LIMIT_WINDOW_MINUTES || 10) * 60_000,
    },
  };
}
