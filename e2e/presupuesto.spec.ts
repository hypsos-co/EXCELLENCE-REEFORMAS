import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const DATA_DIR = path.resolve(".data-e2e");
const PHOTOS = [path.resolve("src/assets/obras/cocina.jpg"), path.resolve("src/assets/obras/bano.jpg")];

const submitButton = (page: Page) => page.locator("button[type=submit][form=step-form]");
/** Pulsa «Continuar» y espera a que aparezca el paso siguiente. */
async function next(page: Page) {
  const title = page.locator("#step-title");
  const before = await title.textContent();
  await submitButton(page).click();
  await expect(title).not.toHaveText(before ?? "");
}
/** Pulsa «Continuar» esperando que la validación lo impida. */
async function attempt(page: Page) {
  const before = await page.locator("#step-title").textContent();
  await submitButton(page).click();
  await expect(page.locator("#step-title")).toHaveText(before ?? "");
}
/** Pulsa la opción visible (la tarjeta o el chip), como haría una persona. */
const choose = (page: Page, selector: string) => page.locator("label").filter({ has: page.locator(selector) }).first().click();

async function findRecord(reference: string) {
  for (const yyyy of await readdir(path.join(DATA_DIR, "solicitudes"))) {
    for (const mm of await readdir(path.join(DATA_DIR, "solicitudes", yyyy))) {
      const file = path.join(DATA_DIR, "solicitudes", yyyy, mm, reference, "solicitud.json");
      try {
        return JSON.parse(await readFile(file, "utf8"));
      } catch {
        /* sigue buscando */
      }
    }
  }
  throw new Error(`No se encontró la solicitud ${reference}`);
}

test("solicitud completa con fotos: se registra en el servidor antes de mostrar el éxito", async ({ page }) => {
  await page.goto("/solicitar-presupuesto?tipo=cocina", { waitUntil: "networkidle" });
  await expect(page.locator('input[name=reform][value="cocina"]')).toBeChecked();
  await choose(page, 'input[name=extras][value="bano"]');
  await next(page);

  // Validación inmediata: no se puede avanzar sin tipo de inmueble.
  await expect(page.getByRole("heading", { name: /dónde vamos a realizar/i })).toBeVisible();
  await attempt(page);
  await expect(page.getByText("Indícanos el tipo de inmueble.")).toBeVisible();
  await choose(page, 'input[name=property-type][value="piso"]');
  await choose(page, 'input[name=occupancy][value="si"]');
  await next(page);

  await choose(page, 'input[name=cocina-size][value="mediana"]');
  await choose(page, 'input[name=cocina-items][value="otros"]');
  await page.fill("#f-details-cocina-other", "Abrir la cocina al salón");
  await choose(page, 'input[name=bano-size][value="no-se"]');
  await next(page);

  await page.fill("#f-location-locality", "Aranjuez");
  await page.locator("#f-location-locality").blur();
  await expect(page.getByText(/fuera de nuestra zona habitual/)).toBeVisible();
  await next(page);

  await choose(page, 'input[name=timing][value="1-3-meses"]');
  await next(page); // presupuesto omitido

  await page.fill("#f-description", "Cocina blanca y luminosa.");
  await page.setInputFiles("input[type=file]", PHOTOS);
  await expect(page.getByText("2 de 6 fotos")).toBeVisible();
  await expect(page.locator('[aria-label="Optimizando foto"]')).toHaveCount(0, { timeout: 15_000 });
  // Eliminar una foto antes de continuar.
  await page.getByRole("button", { name: /Eliminar foto 2/ }).click();
  await expect(page.getByText("1 de 6 fotos")).toBeVisible();
  await next(page);

  await attempt(page);
  await expect(page.getByText("Escribe tu nombre y apellidos.")).toBeVisible();
  await expect(page.getByText(/debes aceptar la política de privacidad/)).toBeVisible();
  await page.fill("#f-contact-name", "Lucía Martín Pérez");
  await page.fill("#f-contact-phone", "612 345 678");
  await page.fill("#f-contact-email", "lucia@example.com");
  await page.locator("#f-consent-privacy").check();
  await next(page);

  await expect(page.getByRole("heading", { name: /proyecto que queremos ayudarte a transformar/i })).toBeVisible();
  await expect(page.getByText("Cocina + Baño").first()).toBeVisible();
  await expect(page.getByText("Aranjuez, Madrid")).toBeVisible();
  await expect(page.getByText("No indicado")).toBeVisible();

  // Editar desde el resumen y volver.
  await page.getByRole("button", { name: "Editar ubicación" }).click();
  await page.fill("#f-location-postalCode", "28300");
  await page.getByRole("button", { name: /Guardar y volver al resumen/ }).click();
  await expect(page.getByText("Aranjuez, 28300, Madrid")).toBeVisible();

  await page.waitForTimeout(3100); // tiempo mínimo anti-bots del servidor
  await page.getByRole("button", { name: /Enviar mi solicitud/i }).click();
  await expect(page.getByRole("heading", { name: /Gracias por confiar en Excellence Reformas/ })).toBeVisible({ timeout: 20_000 });

  const reference = (await page.locator("strong.tracking-wider").textContent())!.trim();
  const record = await findRecord(reference);
  expect(record.request.reform).toEqual({ primary: "cocina", extras: ["bano"] });
  expect(record.request.location).toMatchObject({ locality: "Aranjuez", postalCode: "28300", province: "Madrid" });
  expect(record.request.planning.budget).toBeUndefined();
  expect(record.zone).toBe("fuera");
  expect(record.photos).toHaveLength(1);
  expect(record.photos[0].mime).toBe("image/jpeg");
});

test("al volver atrás no se pierden las respuestas", async ({ page }) => {
  await page.goto("/solicitar-presupuesto", { waitUntil: "networkidle" });
  await choose(page, 'input[name=reform][value="pintura"]');
  await next(page);
  await choose(page, 'input[name=property-type][value="casa"]');
  await next(page);
  await choose(page, 'input[name=pintura-items][value="techos"]');
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(page.getByRole("heading", { name: /dónde vamos a realizar/i })).toBeVisible();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(page.getByRole("heading", { name: /qué espacio quieres transformar/i })).toBeVisible();
  await expect(page.locator('input[name=reform][value="pintura"]')).toBeChecked();
  await next(page);
  await expect(page.locator('input[name=property-type][value="casa"]')).toBeChecked();
  await next(page);
  await expect(page.locator('input[name=pintura-items][value="techos"]')).toBeChecked();
});

test("se puede completar el primer paso solo con teclado", async ({ page, isMobile }) => {
  test.skip(isMobile, "Prueba de teclado en escritorio");
  await page.goto("/solicitar-presupuesto", { waitUntil: "networkidle" });
  await page.locator('input[name=reform][value="integral"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('input[name=reform][value="cocina"]')).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /dónde vamos a realizar/i })).toBeFocused();
});

test("respeta prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/solicitar-presupuesto?tipo=bano");
  await expect(page.locator('input[name=reform][value="bano"]')).toBeChecked();
  await next(page);
  await expect(page.getByRole("heading", { name: /dónde vamos a realizar/i })).toBeVisible();
  const transform = await page.locator("section[aria-labelledby=step-title]").evaluate((el) => getComputedStyle(el).transform);
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
});

test("la portada lleva al asistente con el tipo preseleccionado", async ({ page }) => {
  await page.goto("/");
  await page.locator('#servicios a[href="/solicitar-presupuesto?tipo=bano"]').click();
  await expect(page).toHaveURL(/tipo=bano/);
  await expect(page.locator('input[name=reform][value="bano"]')).toBeChecked();
});

test("la portada presenta a Julio César y no muestra opiniones si no hay reales", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Hola, soy Julio César/i })).toBeVisible();
  await expect(page.getByAltText(/Julio César, de Excellence Reformas/)).toBeVisible();
  await expect(page.locator("#opiniones")).toHaveCount(0);
});

test("showroom: filtra por tipo, abre el visor y lleva al asistente", async ({ page }) => {
  await page.goto("/showroom", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Reformas reales, terminadas/i })).toBeVisible();
  const items = page.getByRole("button", { name: /^Ver en grande:/ });
  await expect(items).toHaveCount(45);

  await page.getByRole("button", { name: /^Baños/ }).click();
  await expect(page.getByRole("button", { name: /^Baños/ })).toHaveAttribute("aria-pressed", "true");
  await expect(items).toHaveCount(10);

  await items.first().click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-label", /foto 1 de 10/);
  await page.keyboard.press("ArrowRight");
  await expect(dialog).toHaveAttribute("aria-label", /foto 2 de 10/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog).toHaveAttribute("aria-label", /foto 10 de 10/);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await items.nth(1).click();
  await page.getByRole("link", { name: /Quiero algo así/ }).click();
  await expect(page).toHaveURL(/solicitar-presupuesto\?tipo=bano/);
  await expect(page.locator('input[name=reform][value="bano"]')).toBeChecked();
});

test("botón flotante de WhatsApp: abre el número configurado y no estorba en el asistente", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const fab = page.getByRole("link", { name: /Hablar por WhatsApp con Julio César/ });
  await expect(fab).toBeVisible();
  const href = await fab.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/34600000000\?text=/);
  expect(decodeURIComponent(href!.split("text=")[1])).toContain("vengo de la web de Excellence Reformas");
  await expect(page.getByText("¿Hablamos?")).toBeVisible({ timeout: 8000 });
  await page.goto("/solicitar-presupuesto", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Hablar por WhatsApp con Julio César/ })).toHaveCount(0);
});

test("valoración (versión con servidor): se guarda y muestra el agradecimiento", async ({ page }) => {
  await page.goto("/valoracion", { waitUntil: "networkidle" });
  await page.locator("label").filter({ has: page.locator('input[name=rating][value="5"]') }).click();
  await page.locator("label").filter({ has: page.locator('input[name=care][value="si"]') }).click();
  await page.fill("#fb-name", "Marta García");
  await page.locator("#fb-publish").check();
  await page.locator("#fb-privacy").check();
  await page.getByRole("button", { name: /Enviar mi valoración/i }).click();
  await expect(page.getByRole("heading", { name: /¡Gracias, Marta!/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Escríbenos por WhatsApp/ })).toBeVisible();
  const dirs = await readdir(path.join(DATA_DIR, "valoraciones"), { recursive: true });
  expect(dirs.some((d) => String(d).endsWith("valoracion.json"))).toBe(true);
});
