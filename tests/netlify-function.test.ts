import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { fileRef, handleFormSubmission, type HandlerDeps } from "@/lib/netlify/handle-submission";
import { fakeJpeg, validRequest } from "./fixtures";
import { startSmtp } from "./smtp";

let smtp: Awaited<ReturnType<typeof startSmtp>>;
let deps: HandlerDeps;
const fetched: string[] = [];

beforeAll(async () => {
  smtp = await startSmtp();
});
afterAll(async () => smtp.close());
beforeEach(() => {
  smtp.received.length = 0;
  fetched.length = 0;
  deps = {
    smtp: { host: "127.0.0.1", port: smtp.port, secure: false, from: "Web <web@example.com>" },
    notifyTo: ["julio@example.com"],
    confirmClient: true,
    log: () => {},
    now: () => new Date("2026-11-21T15:00:00Z"),
    fetchImpl: (async (url: string | URL | Request) => {
      fetched.push(String(url));
      if (String(url).includes("rota")) return new Response("no", { status: 404 });
      return new Response(new Blob([fakeJpeg(3000) as BlobPart]), { headers: { "content-type": "image/jpeg" } });
    }) as typeof fetch,
  };
});

const toOf = (i: number) => JSON.stringify(smtp.received[i].to);

describe("función de Netlify: emails visuales", () => {
  it("solicitud: email visual con fotos incrustadas para la empresa y confirmación al cliente", async () => {
    const res = await handleFormSubmission(
      {
        formulario: "solicitud-presupuesto",
        referencia: "ER-261121-ABCD",
        datos_json: JSON.stringify(validRequest()),
        foto_1: "https://archivos.netlify.example/foto1.jpg",
        foto_2: JSON.stringify({ url: "https://archivos.netlify.example/foto2.jpg", filename: "salon.jpg", type: "image/jpeg" }),
        foto_3: "https://archivos.netlify.example/rota.jpg",
        "bot-field": "",
      },
      deps,
    );
    expect(res.sent).toEqual(["empresa", "cliente"]);
    expect(fetched).toHaveLength(3);
    const business = smtp.received.find((_, i) => toOf(i).includes("julio@example.com"))!;
    expect(business.subject).toBe("Nueva solicitud de presupuesto · Cocina + Baño · Alcobendas · ER-261121-ABCD");
    expect(business.attachments).toHaveLength(2);
    expect(business.attachments.every((a) => a.contentId)).toBe(true);
    expect(business.html).toContain("cid:foto1@excellence");
    expect(business.html).toContain("https://archivos.netlify.example/rota.jpg"); // la que no se pudo descargar va como enlace
    expect(business.replyTo?.text).toContain("lucia@example.com");
    const client = smtp.received.find((_, i) => toOf(i).includes("lucia@example.com"))!;
    expect(client.subject).toContain("ER-261121-ABCD");
    expect(client.html).toContain("¿Qué pasa ahora?");
  });

  it("valoración baja con petición de llamada: aviso destacado y agradecimiento al cliente", async () => {
    const res = await handleFormSubmission(
      {
        formulario: "valoracion",
        datos_json: JSON.stringify({ rating: 2, care: "no", comment: "La obra va lenta", name: "Ana López", phone: "611222333", email: "ana@example.com", callback: true, publish: false, highlights: ["trato"], privacy: true }),
      },
      deps,
    );
    expect(res.sent).toEqual(["empresa", "cliente"]);
    const business = smtp.received.find((_, i) => toOf(i).includes("julio@example.com"))!;
    expect(business.subject).toMatch(/^⚠️ Valoración ★★☆☆☆ \(2\/5\) · Ana López$/);
    expect(business.html).toContain("Requiere atención");
    expect(business.html).toContain("La obra va lenta");
  });

  it("posventa: email con urgencia y confirmación", async () => {
    const res = await handleFormSubmission(
      {
        formulario: "posventa",
        datos_json: JSON.stringify({ kind: "arreglo", urgency: "urgente", description: "Se ha soltado una baldosa del baño", name: "Pedro Ruiz", phone: "622333444", email: "pedro@example.com", privacy: true }),
        foto_1: "https://archivos.netlify.example/baldosa.jpg",
      },
      deps,
    );
    expect(res.sent).toEqual(["empresa", "cliente"]);
    const business = smtp.received.find((_, i) => toOf(i).includes("julio@example.com"))!;
    expect(business.subject).toBe("URGENTE · Posventa · Pequeño arreglo · Pedro Ruiz");
    expect(business.attachments).toHaveLength(1);
  });

  it("datos incompletos: envía igualmente un resumen genérico con los campos", async () => {
    const res = await handleFormSubmission({ formulario: "solicitud-presupuesto", nombre: "Luis", telefono: "600000000", datos_json: "{roto" }, deps);
    expect(res.sent).toEqual(["empresa"]);
    expect(smtp.received[0].html).toContain("Luis");
  });

  it("sin SMTP configurado no hace nada (Netlify sigue guardando el envío) y descarta bots", async () => {
    expect((await handleFormSubmission({ formulario: "valoracion" }, { ...deps, smtp: null })).skipped).toBe("not_configured");
    expect((await handleFormSubmission({ formulario: "valoracion", "bot-field": "spam" }, deps)).skipped).toBe("spam");
    expect(smtp.received).toHaveLength(0);
  });

  it("interpreta los formatos de archivo de Netlify", () => {
    expect(fileRef("https://x/y.jpg")).toEqual({ url: "https://x/y.jpg" });
    expect(fileRef({ url: "https://x/z.jpg", filename: "z.jpg" })?.filename).toBe("z.jpg");
    expect(fileRef("")).toBeNull();
    expect(fileRef("texto")).toBeNull();
  });
});
