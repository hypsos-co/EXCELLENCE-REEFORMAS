import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LocalStorage } from "@/lib/server/storage";
import { submitBudgetRequest, type SubmitDeps } from "@/lib/server/submissions";
import type { StoredRequest } from "@/lib/server/record";
import { fakeJpeg, validRequest } from "./fixtures";
import { startSmtp } from "./smtp";

let smtp: Awaited<ReturnType<typeof startSmtp>>;
let dir: string;
let deps: SubmitDeps;

beforeAll(async () => {
  smtp = await startSmtp();
});
afterAll(async () => smtp.close());

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "er-test-"));
  smtp.received.length = 0;
  smtp.setReject(false);
  deps = {
    storage: new LocalStorage(dir),
    email: {
      mode: "smtp",
      host: "127.0.0.1",
      port: smtp.port,
      secure: false,
      from: "Web Excellence <web@example.com>",
      to: ["julio@example.com"],
    },
    requireEmail: true,
    confirmClient: false,
    log: () => {},
  };
});
afterEach(async () => rm(dir, { recursive: true, force: true }));

const key = () => crypto.randomUUID();

async function readRecord(reference: string): Promise<StoredRequest> {
  const [yyyy] = await readdir(path.join(dir, "solicitudes"));
  const [mm] = await readdir(path.join(dir, "solicitudes", yyyy));
  return JSON.parse(await readFile(path.join(dir, "solicitudes", yyyy, mm, reference, "solicitud.json"), "utf8"));
}

describe("submitBudgetRequest", () => {
  it("guarda la solicitud y las fotos, y envía el email con adjuntos", async () => {
    const res = await submitBudgetRequest(deps, {
      raw: validRequest(),
      photos: [
        { name: "cocina.jpg", bytes: fakeJpeg() },
        { name: "baño.jpg", bytes: fakeJpeg(4096) },
      ],
      idempotencyKey: key(),
    });
    expect(res).toMatchObject({ ok: true, status: 201, duplicate: false });
    if (!res.ok) return;
    expect(res.reference).toMatch(/^ER-\d{6}-[2-9A-HJ-NP-Z]{4}$/);

    const record = await readRecord(res.reference);
    expect(record.notification.status).toBe("sent");
    expect(record.zone).toBe("habitual");
    expect(record.photos).toHaveLength(2);
    expect(record.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(smtp.received).toHaveLength(1);
    const mail = smtp.received[0];
    expect(mail.subject).toContain("Cocina + Baño");
    expect(mail.subject).toContain(res.reference);
    expect(mail.replyTo?.text).toContain("lucia@example.com");
    expect(mail.attachments.map((a) => a.contentType)).toEqual(["image/jpeg", "image/jpeg"]);
    expect(mail.html).toContain("Lucía Martín");
    expect(mail.html).toContain("https://wa.me/34612345678");
  });

  it("no duplica la solicitud al reintentar con la misma clave", async () => {
    const k = key();
    const first = await submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: k });
    const second = await submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: k });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second).toMatchObject({ status: 200, duplicate: true, reference: first.reference });
    expect(smtp.received).toHaveLength(1);
  });

  it("detecta un envío idéntico con otra clave (doble clic, recarga)", async () => {
    const first = await submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: key() });
    const second = await submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: key() });
    expect(second).toMatchObject({ ok: true, duplicate: true, reference: first.ok ? first.reference : "" });
    expect(smtp.received).toHaveLength(1);
  });

  it("procesa una única vez dos peticiones simultáneas con la misma clave", async () => {
    const k = key();
    const [a, b] = await Promise.all([
      submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: k }),
      submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: k }),
    ]);
    expect(a).toEqual(b);
    expect(smtp.received).toHaveLength(1);
  });

  it("si el email falla, informa del error pero conserva la solicitud; el reintento reenvía el aviso", async () => {
    smtp.setReject(true);
    const k = key();
    const failed = await submitBudgetRequest(deps, { raw: validRequest(), photos: [{ name: "a.jpg", bytes: fakeJpeg() }], idempotencyKey: k });
    expect(failed).toMatchObject({ ok: false, status: 502, code: "notification" });

    smtp.setReject(false);
    const retried = await submitBudgetRequest(deps, { raw: validRequest(), photos: [{ name: "a.jpg", bytes: fakeJpeg() }], idempotencyKey: k });
    expect(retried).toMatchObject({ ok: true, status: 200, duplicate: true });
    if (!retried.ok) return;
    const record = await readRecord(retried.reference);
    expect(record.notification).toMatchObject({ status: "sent", attempts: 2 });
    expect(smtp.received).toHaveLength(1);
    expect(smtp.received[0].attachments).toHaveLength(1);
  });

  it("marca las localidades fuera de la zona habitual sin rechazarlas", async () => {
    const res = await submitBudgetRequest(deps, {
      raw: validRequest({ location: { locality: "Toledo", province: "Toledo" } }),
      photos: [],
      idempotencyKey: key(),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect((await readRecord(res.reference)).zone).toBe("fuera");
    expect(smtp.received[0].html).toContain("fuera de la zona habitual");
  });

  it("rechaza datos no válidos indicando el campo", async () => {
    const res = await submitBudgetRequest(deps, {
      raw: validRequest({ contact: { name: "Ana", phone: "123", email: "ana@example.com" } }),
      photos: [],
      idempotencyKey: key(),
    });
    expect(res).toMatchObject({ ok: false, status: 422, code: "validation" });
    if (res.ok) return;
    expect(Object.keys(res.fieldErrors ?? {})).toContain("contact.phone");
    expect(smtp.received).toHaveLength(0);
  });

  it("rechaza archivos que no son imágenes y el exceso de fotos", async () => {
    const notImage = await submitBudgetRequest(deps, {
      raw: validRequest(),
      photos: [{ name: "virus.jpg", bytes: new TextEncoder().encode("MZ-not-an-image-at-all") }],
      idempotencyKey: key(),
    });
    expect(notImage).toMatchObject({ ok: false, code: "photos" });
    const tooMany = await submitBudgetRequest(deps, {
      raw: validRequest(),
      photos: Array.from({ length: 7 }, (_, i) => ({ name: `${i}.jpg`, bytes: fakeJpeg() })),
      idempotencyKey: key(),
    });
    expect(tooMany).toMatchObject({ ok: false, code: "photos" });
  });

  it("exige una clave de envío válida", async () => {
    const res = await submitBudgetRequest(deps, { raw: validRequest(), photos: [], idempotencyKey: "abc" });
    expect(res).toMatchObject({ ok: false, status: 400 });
  });

  it("en modo vista previa guarda el email junto a la solicitud", async () => {
    const res = await submitBudgetRequest(
      { ...deps, email: { mode: "preview" }, requireEmail: false },
      { raw: validRequest(), photos: [], idempotencyKey: key() },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const record = await readRecord(res.reference);
    expect(record.notification.status).toBe("preview");
  });
});

describe("confirmación al cliente", () => {
  it("envía un segundo email, al cliente, con su referencia", async () => {
    const res = await submitBudgetRequest({ ...deps, confirmClient: true }, { raw: validRequest(), photos: [], idempotencyKey: crypto.randomUUID() });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(smtp.received).toHaveLength(2);
    const toClient = smtp.received.find((m) => m.to && JSON.stringify(m.to).includes("lucia@example.com"))!;
    expect(toClient.subject).toContain(res.reference);
    expect(toClient.html).toContain("¿Qué pasa ahora?");
    const toBusiness = smtp.received.find((m) => JSON.stringify(m.to).includes("julio@example.com"))!;
    expect(toBusiness.subject).toContain("Nueva solicitud de presupuesto");
  });
});
