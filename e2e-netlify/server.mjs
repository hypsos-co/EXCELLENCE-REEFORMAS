// Servidor local que imita a Netlify para probar la carpeta `out/`:
//  - sirve el HTML estático con URLs «bonitas» (/showroom → showroom.html) y 404.html,
//  - recibe POST de Netlify Forms como Netlify: exige un formulario registrado en
//    __forms.html y solo acepta los campos declarados en él,
//  - imita la función `opiniones`: las valoraciones con permiso de publicación
//    se sirven en GET /api/opiniones (versión simplificada de src/lib/reviews).
// Uso: node e2e-netlify/server.mjs [carpeta=out] [puerto=3200]
import http from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 3200);
const dataDir = path.resolve(".data-netlify");

const skeleton = await readFile(path.join(root, "__forms.html"), "utf8");
const forms = new Map();
for (const m of skeleton.matchAll(/<form[^>]*\sname="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)) {
  forms.set(m[1], new Set([...m[2].matchAll(/<(?:input|textarea)[^>]*\sname="([^"]+)"/g)].map((f) => f[1])));
}

const reviewsDir = path.resolve(".data-netlify-blobs");
const reviewsFile = path.join(reviewsDir, "opiniones.json");
async function readReviews() {
  try {
    return JSON.parse(await readFile(reviewsFile, "utf8"));
  } catch {
    return [];
  }
}
async function maybePublish(fields) {
  if (fields["form-name"] !== "valoracion") return;
  let d;
  try {
    d = JSON.parse(fields.datos_json ?? "");
  } catch {
    return;
  }
  if (!d.publish || !d.name) return;
  const [first, second] = String(d.name).trim().split(/\s+/);
  const list = await readReviews();
  list.push({
    id: Math.random().toString(16).slice(2, 14),
    name: `${first}${second ? ` ${second[0].toUpperCase()}.` : ""}`,
    rating: d.rating,
    ...(d.comment ? { text: String(d.comment).trim() } : {}),
    createdAt: new Date().toISOString(),
  });
  await mkdir(reviewsDir, { recursive: true });
  await writeFile(reviewsFile, JSON.stringify(list, null, 2));
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2",
  ".xml": "application/xml", ".json": "application/json",
};

async function fileFor(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const base = path.join(root, clean);
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, `${base}.html`, path.join(base, "index.html")]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  return null;
}

http
  .createServer(async (req, res) => {
    try {
      if (req.method === "POST") {
        const request = new Request(`http://localhost${req.url}`, { method: "POST", headers: req.headers, body: req, duplex: "half" });
        const form = await request.formData();
        const name = String(form.get("form-name") ?? "");
        const allowed = forms.get(name);
        if (!allowed) {
          res.writeHead(404, { "content-type": "text/plain" }).end("Form not found");
          return;
        }
        const unknown = [...new Set(form.keys())].filter((k) => k !== "form-name" && !allowed.has(k));
        if (unknown.length) {
          res.writeHead(400, { "content-type": "text/plain" }).end(`Unknown fields: ${unknown.join(", ")}`);
          return;
        }
        if (form.get("bot-field")) {
          res.writeHead(200, { "content-type": "text/html" }).end("<p>Thank you</p>");
          return;
        }
        const id = `${Date.now()}-${String(form.get("referencia") ?? "sin-ref")}`;
        const dir = path.join(dataDir, id);
        await mkdir(dir, { recursive: true });
        const fields = {};
        const files = {};
        for (const [k, v] of form.entries()) {
          if (typeof v === "string") fields[k] = v;
          else {
            const out = path.join(dir, `${k}-${v.name}`);
            await writeFile(out, Buffer.from(await v.arrayBuffer()));
            files[k] = { name: v.name, type: v.type, size: v.size };
          }
        }
        await writeFile(path.join(dir, "submission.json"), JSON.stringify({ fields, files }, null, 2));
        await maybePublish(fields);
        res.writeHead(200, { "content-type": "text/html" }).end("<p>Thank you for your submission</p>");
        return;
      }
      if ((req.url ?? "").split("?")[0] === "/api/opiniones") {
        const list = (await readReviews()).filter((r) => !r.hidden).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const average = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : null;
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ reviews: list, count: list.length, average }));
        return;
      }
      const file = await fileFor(req.url ?? "/");
      if (!file) {
        const notFound = await readFile(path.join(root, "404.html"));
        res.writeHead(404, { "content-type": TYPES[".html"] }).end(notFound);
        return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" }).end(String(err));
    }
  })
  .listen(port, () => console.log(`Netlify simulado en http://localhost:${port} (${root})`));
