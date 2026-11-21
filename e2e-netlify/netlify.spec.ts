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
  for (const url of ["/", "/showroom", "/solicitar-presupuesto", "/politica-de-privacidad"]) {
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
