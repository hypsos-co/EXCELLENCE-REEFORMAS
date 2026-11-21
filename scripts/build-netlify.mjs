// Compila la versión HTML estática para Netlify en la carpeta `out/`.
// Uso: npm run build:netlify   (funciona igual en Windows, macOS y Linux)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const env = { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_SUBMIT_TARGET: "netlify", NEXT_TELEMETRY_DISABLED: "1" };
for (const dir of ["out", ".next"]) if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("npx", ["next", "build"]);
run("node", ["scripts/export-images.mjs", "out/_next/static/media"]);

// robots.txt y sitemap.xml (en la versión con servidor los generan src/app/robots.txt y src/app/sitemap.xml).
// Mantener PAGES en sincronía con src/lib/seo.ts.
const configured = /domain:\s*"([^"]*)"/.exec(readFileSync("src/config/site.ts", "utf8"))?.[1] ?? "";
const base = (configured || process.env.URL || "").replace(/\/+$/, "");
const PAGES = ["/", "/showroom", "/solicitar-presupuesto", "/politica-de-privacidad"];
writeFileSync(
  "out/robots.txt",
  `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /__forms.html\n${base ? `\nSitemap: ${base}/sitemap.xml\n` : ""}`,
);
if (base) {
  const urls = PAGES.map((p) => `  <url><loc>${base}${p}</loc></url>`).join("\n");
  writeFileSync("out/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
} else {
  console.warn("Aviso: sin dominio en src/config/site.ts → no se genera sitemap.xml.");
}
console.log("\nListo: sube la carpeta `out/` a Netlify (o despliega el repositorio con netlify.toml).");
