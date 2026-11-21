// Genera los iconos de la app (PWA) a partir del logotipo oficial.
// Uso: node scripts/generate-icons.mjs   (los PNG resultantes se guardan en public/icons/)
import { readFileSync } from "node:fs";
import sharp from "sharp";

const src = readFileSync("src/components/brand/logo-paths.ts", "utf8");
const block = (name) => [...(src.split(`export const ${name}`)[1].split("];")[0].matchAll(/"(M[^"]+)"/g))].map((m) => m[1]);
const houses = block("HOUSES_PATHS");
const word = block("WORDMARK_PATHS");
const tagline = [...src.split("TAGLINE_GLYPHS")[1].matchAll(/\[([\d.]+), ([\d.]+), "([^"]+)"\]/g)].map((m) => [m[1], m[2], m[3]]);

function svg(size, logoWidth, radius = 0) {
  const scale = logoWidth / 920;
  const h = 590 * scale;
  const x = (size - logoWidth) / 2;
  const y = (size - h) / 2;
  const paths = [...houses, ...word].map((d) => `<path d="${d}"/>`).join("") + tagline.map(([tx, ty, d]) => `<path transform="translate(${tx} ${ty})" d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#102B49"/><g transform="translate(${x} ${y}) scale(${scale})" fill="#FFFFFF">${paths}</g></svg>`;
}

const jobs = [
  ["icon-192.png", 192, 150],
  ["icon-512.png", 512, 400],
  ["icon-maskable-512.png", 512, 300], // zona segura: el sistema recorta en círculo o «squircle»
  ["apple-touch-icon.png", 180, 136],
];
for (const [name, size, w] of jobs) {
  await sharp(Buffer.from(svg(size, w))).png({ compressionLevel: 9 }).toFile(`public/icons/${name}`);
  console.log("icono", name);
}
