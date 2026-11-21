import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { depsFromEnv, fileRef, handleFormSubmission, type HandlerDeps } from "@/lib/netlify/handle-submission";
import type { ReviewStore } from "@/lib/netlify/reviews-store";
import { cleanPublicText, moderationUrl, publicName, signAction, summarize, verifyAction, type PublicReview } from "@/lib/reviews/public";
import { moderationPage, reviewsResponse } from "@/lib/reviews/http";
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
    expect(business.subject).toMatch(/^(🔥 )?Nuevo cliente: Lucía Martín · Cocina \+ Baño en Alcobendas · ER-261121-ABCD$/);
    // Ficha comercial: prioridad, acciones a un clic y mensaje ya redactado
    expect(business.html).toMatch(/Prioridad (alta|media)|Contactar en 24-48 h/);
    expect(business.html).toContain("https://wa.me/34612345678?text=");
    expect(business.html).toContain("calendar.google.com/calendar/render");
    expect(business.html).toContain("20261123T100000%2F20261123T101500"); // seguimiento a los 2 días, 10:00 de Madrid
    expect(business.html).toContain("Agendar visita");
    expect(business.html).toContain("De solicitud a cliente fiel");
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

/* ------------------------------ Opiniones públicas ----------------------------- */

function memoryStore(): ReviewStore & { items: Map<string, PublicReview> } {
  const items = new Map<string, PublicReview>();
  return {
    items,
    async save(r) {
      items.set(r.id, r);
    },
    async get(id) {
      return items.get(id) ?? null;
    },
    async list() {
      return [...items.values()];
    },
    async setHidden(id, hidden) {
      const r = items.get(id);
      if (!r) return null;
      const next = { ...r, hidden };
      items.set(id, next);
      return next;
    },
    async secret() {
      return "secreto-de-prueba";
    },
  };
}

describe("opiniones públicas", () => {
  const review = (extra: Record<string, unknown>) => ({
    formulario: "valoracion",
    datos_json: JSON.stringify({ rating: 5, care: "si", comment: "Trabajo impecable, muy limpios. Llamadme al 611 222 333", name: "maría garcía lópez", highlights: ["limpieza", "trato"], privacy: true, ...extra }),
  });

  it("se publica solo con permiso, con nombre e inicial y sin datos personales", async () => {
    const store = memoryStore();
    const res = await handleFormSubmission(review({ publish: true }), { ...deps, reviews: { store, siteUrl: "https://excellence.example" } });
    expect(res.published).toBe(true);
    const [saved] = [...store.items.values()];
    expect(saved.name).toBe("María G.");
    expect(saved.rating).toBe(5);
    expect(saved.text).toBe("Trabajo impecable, muy limpios. Llamadme al [teléfono]");
    expect(saved.highlights).toEqual(["La limpieza", "El trato"]);
    // El email a la empresa lleva el enlace firmado para ocultarla
    const business = smtp.received.find((_, i) => toOf(i).includes("julio@example.com"))!;
    expect(business.html).toContain("Publicada en la web");
    const link = String(business.html).match(/https:\/\/excellence\.example\/api\/opiniones\/moderar\?[^"]+/)![0].replace(/&amp;/g, "&");
    const u = new URL(link);
    expect(u.searchParams.get("id")).toBe(saved.id);
    expect(await verifyAction("secreto-de-prueba", saved.id, "ocultar", u.searchParams.get("firma")!)).toBe(true);
    expect(await verifyAction("secreto-de-prueba", saved.id, "mostrar", u.searchParams.get("firma")!)).toBe(false);

    const noPermission = memoryStore();
    await handleFormSubmission(review({ publish: false }), { ...deps, reviews: { store: noPermission } });
    expect(noPermission.items.size).toBe(0);
  });

  it("se guarda aunque el email todavía no esté configurado", async () => {
    const store = memoryStore();
    const res = await handleFormSubmission(review({ publish: true }), { ...deps, smtp: null, reviews: { store } });
    expect(res.skipped).toBe("not_configured");
    expect(res.published).toBe(true);
    expect(store.items.size).toBe(1);
  });

  it("resumen: media, recuento, orden y ocultas fuera", () => {
    const base = { highlights: [], text: "" };
    const list: PublicReview[] = [
      { ...base, id: "a", name: "A", rating: 5, createdAt: "2026-11-01T10:00:00Z" },
      { ...base, id: "b", name: "B", rating: 4, createdAt: "2026-11-20T10:00:00Z" },
      { ...base, id: "c", name: "C", rating: 1, createdAt: "2026-11-10T10:00:00Z", hidden: true },
    ];
    const s = summarize(list);
    expect(s.count).toBe(2);
    expect(s.average).toBe(4.5);
    expect(s.reviews.map((r) => r.id)).toEqual(["b", "a"]);
    expect(summarize([]).average).toBeNull();
  });

  it("nombre público y limpieza del texto", () => {
    expect(publicName("  josé   ANTONIO pérez ")).toBe("José A.");
    expect(publicName("Lucía")).toBe("Lucía");
    expect(cleanPublicText("Escribidme a ana@mail.com o en www.spam.com, presupuesto de 2.500 € el 12-10-2026")).toBe(
      "Escribidme a [email] o en [enlace] presupuesto de 2.500 € el 12-10-2026",
    );
  });

  it("moderación: el enlace solo pide confirmación; el botón oculta; firmas falsas rechazadas", async () => {
    const store = memoryStore();
    await store.save({ id: "abc123", name: "Pepe L.", rating: 1, text: "spam spam", createdAt: "2026-11-21T10:00:00Z" });
    const site = "https://excellence.example";
    const sig = await signAction(await store.secret(), "abc123", "ocultar");
    const link = moderationUrl(site, "abc123", "ocultar", sig);

    const bad = await moderationPage(new Request(link.replace(sig, "x".repeat(sig.length))), store);
    expect(bad.status).toBe(403);

    const confirm = await moderationPage(new Request(link), store);
    expect(confirm.status).toBe(200);
    expect(await confirm.text()).toContain("Sí, ocultarla");
    expect((await store.get("abc123"))?.hidden).toBeUndefined(); // abrir el enlace no cambia nada

    const body = new URLSearchParams({ id: "abc123", accion: "ocultar", firma: sig });
    const done = await moderationPage(new Request(`${site}/api/opiniones/moderar`, { method: "POST", body }), store);
    expect(await done.text()).toContain("Opinión ocultada");
    expect((await store.get("abc123"))?.hidden).toBe(true);

    const api = await (await reviewsResponse(store)).json();
    expect(api).toEqual({ reviews: [], count: 0, average: null });
  });

  it("sin la contraseña SMTP no intenta enviar (pero las opiniones se siguen publicando)", () => {
    const env: Record<string, string> = { SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "465", SMTP_USER: "a@gmail.com", NOTIFY_EMAIL_TO: "a@gmail.com" };
    expect(depsFromEnv((k) => env[k]).smtp).toBeNull();
    expect(depsFromEnv((k) => ({ ...env, SMTP_PASS: "x" })[k])?.smtp?.secure).toBe(true);
  });
});
