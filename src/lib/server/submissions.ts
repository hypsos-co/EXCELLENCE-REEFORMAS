import { createHash, randomUUID } from "node:crypto";
import { budgetRequestSchema, issuesToFieldErrors, normalizePhone, type BudgetRequest } from "@/lib/budget/schema";
import { UPLOAD_LIMITS } from "@/lib/budget/uploads";
import { normalizeText, serviceZone } from "@/lib/budget/zone";
import { buildNotificationEmail, sendNotification, type Attachment } from "./email";
import { buildBudgetConfirmation } from "@/lib/email/templates";
import type { EmailConfig } from "./env";
import { displayName, sniffImage } from "./files";
import { formatMadrid, makeReference, recordKey, type StoredPhoto, type StoredRequest } from "./record";
import { getJson, putJson, type Storage } from "./storage";

export type IncomingPhoto = { name: string; bytes: Uint8Array };

export type SubmitDeps = {
  storage: Storage;
  email: EmailConfig;
  /** Si es true, solo se confirma al cliente cuando el email ha salido. */
  requireEmail: boolean;
  /** Enviar al cliente un email de confirmación (por defecto, sí). */
  confirmClient?: boolean;
  now?: () => Date;
  log?: (msg: string, extra?: unknown) => void;
};

export type SubmitResult =
  | { ok: true; status: 200 | 201; reference: string; duplicate: boolean }
  | { ok: false; status: number; code: string; message: string; fieldErrors?: Record<string, string> };

const DUPLICATE_WINDOW_MS = 15 * 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const inFlight = new Map<string, Promise<SubmitResult>>();

export function fingerprint(r: BudgetRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        normalizePhone(r.contact.phone).slice(-9),
        r.contact.email.toLowerCase(),
        r.reform.primary,
        normalizeText(r.location.locality),
        normalizeText(r.description ?? ""),
      ]),
    )
    .digest("hex");
}

type IndexEntry = { recordKey: string; at: string };

export async function submitBudgetRequest(
  deps: SubmitDeps,
  input: { raw: unknown; photos: IncomingPhoto[]; idempotencyKey: string },
): Promise<SubmitResult> {
  if (!UUID.test(input.idempotencyKey)) {
    return { ok: false, status: 400, code: "bad_request", message: "Falta el identificador de envío." };
  }
  const running = inFlight.get(input.idempotencyKey);
  if (running) return running;
  const promise = processSubmission(deps, input).finally(() => inFlight.delete(input.idempotencyKey));
  inFlight.set(input.idempotencyKey, promise);
  return promise;
}

async function processSubmission(
  deps: SubmitDeps,
  input: { raw: unknown; photos: IncomingPhoto[]; idempotencyKey: string },
): Promise<SubmitResult> {
  const { storage } = deps;
  const now = deps.now?.() ?? new Date();
  const log = deps.log ?? ((m: string, e?: unknown) => console.error(`[solicitudes] ${m}`, e ?? ""));

  // 1. Validación de datos
  const parsed = budgetRequestSchema.safeParse(input.raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      code: "validation",
      message: "Hay datos que revisar antes de enviar la solicitud.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const request = parsed.data;

  // 2. Validación de fotografías (tipo real por firma binaria y tamaño)
  const photoError = (message: string): SubmitResult => ({
    ok: false,
    status: 422,
    code: "photos",
    message,
    fieldErrors: { photos: message },
  });
  if (input.photos.length > UPLOAD_LIMITS.maxFiles) {
    return photoError(`Puedes adjuntar como máximo ${UPLOAD_LIMITS.maxFiles} fotografías.`);
  }
  let total = 0;
  const photos: { kind: { mime: string; ext: string }; name: string; bytes: Uint8Array }[] = [];
  for (const p of input.photos) {
    total += p.bytes.byteLength;
    if (p.bytes.byteLength > UPLOAD_LIMITS.maxFileBytes) return photoError(`La foto «${displayName(p.name)}» es demasiado pesada.`);
    const kind = sniffImage(p.bytes);
    if (!kind || !(UPLOAD_LIMITS.acceptedMimeTypes as readonly string[]).includes(kind.mime)) {
      return photoError(`El archivo «${displayName(p.name)}» no es una imagen válida (JPG, PNG, WEBP o HEIC).`);
    }
    photos.push({ kind, name: displayName(p.name), bytes: p.bytes });
  }
  if (total > UPLOAD_LIMITS.maxTotalBytes) return photoError("Las fotografías ocupan demasiado en total. Prueba con menos fotos.");

  try {
    // 3. Envíos repetidos: mismo identificador de envío
    const idemKey = `indices/idempotency/${input.idempotencyKey}.json`;
    const previous = await getJson<IndexEntry>(storage, idemKey);
    if (previous) return await replay(deps, previous.recordKey, log);

    // 4. Envíos duplicados: mismo contenido en los últimos minutos
    const fp = fingerprint(request);
    const fpKey = `indices/fingerprints/${fp}.json`;
    const similar = await getJson<IndexEntry>(storage, fpKey);
    if (similar && now.getTime() - new Date(similar.at).getTime() < DUPLICATE_WINDOW_MS) {
      await putJson(storage, idemKey, similar);
      return await replay(deps, similar.recordKey, log);
    }

    // 5. Registro de la solicitud (primero las fotos, después el JSON)
    const reference = makeReference(now);
    const base = { receivedAt: now.toISOString(), reference };
    const storedPhotos: StoredPhoto[] = [];
    for (const [i, p] of photos.entries()) {
      const key = recordKey(base, `fotos/foto-${String(i + 1).padStart(2, "0")}.${p.kind.ext}`);
      await storage.put(key, p.bytes, p.kind.mime);
      storedPhotos.push({ key, name: p.name, mime: p.kind.mime, size: p.bytes.byteLength });
    }
    const record: StoredRequest = {
      schema: 1,
      id: randomUUID(),
      reference,
      receivedAt: base.receivedAt,
      receivedAtMadrid: formatMadrid(now),
      source: "web/solicitar-presupuesto",
      zone: serviceZone(request.location),
      idempotencyKey: input.idempotencyKey,
      fingerprint: fp,
      request,
      photos: storedPhotos,
      notification: { status: "pending", attempts: 0 },
    };
    const key = recordKey(record);
    await putJson(storage, key, record);
    const entry: IndexEntry = { recordKey: key, at: record.receivedAt };
    await putJson(storage, idemKey, entry);
    await putJson(storage, fpKey, entry);

    // 6. Aviso por email a Excellence Reformas
    const attachments: Attachment[] = photos.map((p, i) => ({
      filename: `${reference}-foto-${i + 1}.${p.kind.ext}`,
      content: p.bytes,
      contentType: p.kind.mime,
    }));
    const notified = await notify(deps, key, record, attachments, log);
    if (!notified && deps.requireEmail) return notificationFailed(reference);
    if (deps.confirmClient !== false) await confirmClient(deps, key, record, log);
    return { ok: true, status: 201, reference, duplicate: false };
  } catch (err) {
    log("Error guardando la solicitud", err);
    return {
      ok: false,
      status: 500,
      code: "storage",
      message: "No hemos podido registrar tu solicitud. Inténtalo de nuevo en unos minutos.",
    };
  }
}

function notificationFailed(reference: string): SubmitResult {
  return {
    ok: false,
    status: 502,
    code: "notification",
    message: `No hemos podido completar el envío (ref. ${reference}). Pulsa «Reintentar»: no se duplicará tu solicitud.`,
  };
}

/** Repite el aviso de una solicitud ya registrada si no llegó a enviarse. */
async function replay(deps: SubmitDeps, key: string, log: NonNullable<SubmitDeps["log"]>): Promise<SubmitResult> {
  const record = await getJson<StoredRequest>(deps.storage, key);
  if (!record) throw new Error(`Índice apunta a una solicitud inexistente: ${key}`);
  if (record.notification.status === "sent" || (record.notification.status === "preview" && !deps.requireEmail)) {
    return { ok: true, status: 200, reference: record.reference, duplicate: true };
  }
  const attachments: Attachment[] = [];
  for (const [i, p] of record.photos.entries()) {
    const bytes = await deps.storage.get(p.key);
    if (bytes) {
      attachments.push({
        filename: `${record.reference}-foto-${i + 1}.${p.key.split(".").pop()}`,
        content: bytes,
        contentType: p.mime,
      });
    }
  }
  const ok = await notify(deps, key, record, attachments, log);
  if (!ok && deps.requireEmail) return notificationFailed(record.reference);
  return { ok: true, status: 200, reference: record.reference, duplicate: true };
}

async function notify(
  deps: SubmitDeps,
  key: string,
  record: StoredRequest,
  attachments: Attachment[],
  log: NonNullable<SubmitDeps["log"]>,
): Promise<boolean> {
  const message = buildNotificationEmail(record, attachments);
  const attemptAt = (deps.now?.() ?? new Date()).toISOString();
  record.notification.attempts += 1;
  record.notification.lastAttemptAt = attemptAt;
  try {
    const res = await sendNotification(deps.email, message);
    if (res.status === "sent") {
      record.notification = { ...record.notification, status: "sent", messageId: res.messageId, error: undefined };
    } else {
      record.notification = { ...record.notification, status: "preview", error: undefined };
      await deps.storage.put(key.replace(/solicitud\.json$/, "email-preview.html"), message.html, "text/html; charset=utf-8");
      log(`Email no configurado: vista previa guardada para ${record.reference}`);
    }
    await putJson(deps.storage, key, record);
    return res.status === "sent" || !deps.requireEmail;
  } catch (err) {
    log(`Fallo enviando el email de ${record.reference}`, err);
    record.notification = {
      ...record.notification,
      status: "failed",
      error: err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300),
    };
    await putJson(deps.storage, key, record).catch((e) => log("No se pudo actualizar el estado del aviso", e));
    return false;
  }
}

/** Confirmación al cliente. No bloquea la solicitud: si falla, solo se registra. */
async function confirmClient(deps: SubmitDeps, key: string, record: StoredRequest, log: NonNullable<SubmitDeps["log"]>) {
  try {
    const message = buildBudgetConfirmation(record);
    const res = await sendNotification(deps.email, message, [record.request.contact.email]);
    if (res.status === "preview") {
      await deps.storage.put(key.replace(/solicitud\.json$/, "email-cliente-preview.html"), message.html, "text/html; charset=utf-8");
    }
  } catch (err) {
    log(`No se pudo enviar la confirmación al cliente de ${record.reference}`, err);
  }
}
