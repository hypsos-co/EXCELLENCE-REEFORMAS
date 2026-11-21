import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const DATA_DIR = path.resolve(".data-netlify");
const PHOTOS = [path.resolve("src/assets/obras/cocina.jpg"), path.resolve("src/assets/obras/bano.jpg")];

const submitButton = (page: Page) => page.locator("button[type=submit][form=step-form]");
async function next(page: Page) {
  const title = page.locator("#step-title");
  const before = await title.textContent();
  await submitButton(page).click();
  await expect(title).not.toHaveText(before ?? "");
}
const choose = (page: Page, selector: string) => page.locator("label").filter({ has: page.locator(selector) }).first().click();

async function fillWizard(page: Page) {
  await page.goto("/solicitar-presupuesto?tipo=cocina", { waitUntil: "networkidle" });
  await expect(page.locator('input[name=reform][value="cocina"]')).toBeChecked();
  await choose(page, 'input[name=extras][value="bano"]');
  await next(page);
  await choose(page, 'input[name=property-type][value="piso"]');
  await next(page);
  await choose(page, 'input[name=cocina-size][value="mediana"]');
  await next(page);
  await page.fill("#f-location-locality", "Alcobendas");
  await next(page);
  await choose(page, 'input[name=timing][value="1-3-meses"]');
  await next(page);
  await page.fill("#f-description", "Cocina blanca y luminosa, baño con plato de ducha.");
  await page.setInputFiles("input[type=file]", PHOTOS);
  await expect(page.getByText("2 de 6 fotos")).toBeVisible();
  await expect(page.locator('[aria-label="Optimizando foto"]')).toHaveCount(0, { timeout: 15_000 });
  await next(page);
  await page.fill("#f-contact-name", "Lucía Martín Pérez");
  await page.fill("#f-contact-phone", "612 345 678");
  await page.fill("#f-contact-email", "lucia@example.com");
  await page.locator("#f-consent-privacy").check();
  await next(page);
  await expect(page.getByRole("heading", { name: /proyecto que queremos ayudarte a transformar/i })).toBeVisible();
}

async function findSubmission(reference: string) {
  for (const dir of await readdir(DATA_DIR)) {
    if (dir.endsWith(reference)) return JSON.parse(await readFile(path.join(DATA_DIR, dir, "submission.json"), "utf8"));
  }
  throw new Error(`No se recibió la solicitud ${reference}`);
}

test("la solicitud se envía a Netlify Forms con los datos y las fotos", async ({ page }) => {
  await fillWizard(page);
  await page.getByRole("button", { name: /Enviar mi solicitud/i }).click();
  await expect(page.getByRole("heading", { name: /Gracias por confiar en Excellence Reformas/ })).toBeVisible({ timeout: 20_000 });
  const reference = (await page.locator("strong.tracking-wider").textContent())!.trim();
  expect(reference).toMatch(/^ER-\d{6}-[2-9A-HJ-NP-Z]{4}$/);

  const s = await findSubmission(reference);
  expect(s.fields["form-name"]).toBe("solicitud-presupuesto");
  expect(s.fields.nombre).toBe("Lucía Martín Pérez");
  expect(s.fields.tipo_reforma).toBe("Cocina + Baño");
  expect(s.fields.zona).toBe("Zona habitual");
  expect(s.fields.subject).toBe(`Nueva solicitud ${reference} · Cocina + Baño · Alcobendas`);
  expect(s.fields.resumen).toContain("Cocina · Tamaño: Mediana");
  expect(s.fields["bot-field"]).toBe("");
  expect(Object.keys(s.files)).toEqual(["foto_1", "foto_2"]);
  expect(s.files.foto_1.type).toBe("image/jpeg");
});

test("si Netlify no acepta el envío, no se muestra un éxito falso", async ({ page }) => {
  await fillWizard(page);
  await page.route("**/__forms.html", (route) =>
    route.request().method() === "POST" ? route.fulfill({ status: 404, body: "Not found" }) : route.continue(),
  );
  await page.getByRole("button", { name: /Enviar mi solicitud/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: "todavía no está activo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Gracias por confiar/ })).toHaveCount(0);
});

test("todas las páginas y fotos cargan sin errores", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on("pageerror", (e) => failed.push(`pageerror ${e.message}`));
  for (const url of ["/", "/showroom", "/solicitar-presupuesto", "/clientes", "/valoracion", "/politica-de-privacidad"]) {
    await page.goto(url, { waitUntil: "networkidle" });
    for (let y = 0; y < 14000; y += 900) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(60);
    }
    await page.waitForLoadState("networkidle");
  }
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  expect(failed).toEqual([]);
  expect(broken).toEqual([]);
});

test("el showroom funciona en la versión estática", async ({ page }) => {
  await page.goto("/showroom", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /^Ver en grande:/ })).toHaveCount(45);
  const src = await page.getByRole("button", { name: /^Ver en grande:/ }).first().locator("img").getAttribute("src");
  expect(src).toMatch(/\.w\d+\.webp$/);
  await page.getByRole("button", { name: /^Ver en grande:/ }).first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("una dirección inexistente muestra la página 404", async ({ page }) => {
  const res = await page.goto("/no-existe");
  expect(res?.status()).toBe(404);
});

async function findForm(form: string, predicate: (s: { fields: Record<string, string>; files: Record<string, unknown> }) => boolean) {
  for (const dir of (await readdir(DATA_DIR)).sort().reverse()) {
    const s = JSON.parse(await readFile(path.join(DATA_DIR, dir, "submission.json"), "utf8"));
    if (s.fields["form-name"] === form && predicate(s)) return s;
  }
  throw new Error(`No se recibió el formulario ${form}`);
}

test("valoración: se envía a Netlify Forms y adapta el agradecimiento", async ({ page }) => {
  await page.goto("/valoracion", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Enviar mi valoración/i }).click();
  await expect(page.getByText("Elige de 1 a 5 estrellas.")).toBeVisible();
  await choose(page, 'input[name=rating][value="2"]');
  await choose(page, 'input[name=care][value="no"]');
  await expect(page.getByText("Sentimos que algo no esté yendo bien.")).toBeVisible();
  await page.fill("#fb-comment", "La obra va más lenta de lo esperado.");
  await page.locator("#fb-callback").check();
  await page.fill("#fb-name", "Ana López");
  await page.fill("#fb-phone", "611 222 333");
  await page.locator("#fb-privacy").check();
  await page.getByRole("button", { name: /Enviar mi valoración/i }).click();
  await expect(page.getByRole("heading", { name: /Gracias por contárnoslo, Ana/ })).toBeVisible();
  const s = await findForm("valoracion", (x) => x.fields.nombre === "Ana López");
  expect(s.fields.estrellas).toBe("★★☆☆☆");
  expect(s.fields.quiere_llamada).toBe("Sí");
  expect(JSON.parse(s.fields.datos_json)).toMatchObject({ rating: 2, care: "no", callback: true });
});

test("posventa: la consulta con foto llega a Netlify Forms", async ({ page }) => {
  await page.goto("/clientes", { waitUntil: "networkidle" });
  await choose(page, 'input[name=ac-kind][value="arreglo"]');
  await page.fill("#ac-description", "Una puerta del armario roza al cerrar.");
  await choose(page, 'input[name=ac-urgency][value="pronto"]');
  await page.locator('#posventa input[type=file]').setInputFiles([PHOTOS[0]]);
  await expect(page.getByRole("button", { name: "Eliminar foto 1" })).toBeVisible();
  await expect(page.getByText("Optimizando…")).toHaveCount(0, { timeout: 15_000 });
  await page.fill("#ac-name", "Pedro Ruiz");
  await page.fill("#ac-phone", "622 333 444");
  await page.locator("#ac-privacy").check();
  await page.getByRole("button", { name: /Enviar consulta/i }).click();
  await expect(page.getByRole("heading", { name: /Recibido, Pedro/ })).toBeVisible();
  const s = await findForm("posventa", (x) => x.fields.nombre === "Pedro Ruiz");
  expect(s.fields.tipo_ayuda).toBe("Pequeño arreglo");
  expect(s.fields.urgencia).toBe("Lo antes posible");
  expect(Object.keys(s.files)).toEqual(["foto_1"]);
});

test("la app es instalable: manifest, iconos y service worker publicados", async ({ page, request }) => {
  await page.goto("/clientes", { waitUntil: "networkidle" });
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");
  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
  expect((await request.get("/sw.js")).status()).toBe(200);
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration())), { timeout: 10_000 }).toBe(true);
});
