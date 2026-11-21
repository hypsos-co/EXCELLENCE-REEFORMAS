// Genera las versiones WebP que usa src/lib/image-loader.ts en la exportación estática.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [64, 128, 256, 384, 640, 960, 1280, 1920]; // = imageSizes + deviceSizes de next.config.ts
const dir = path.resolve(process.argv[2] ?? "out/_next/static/media");

const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
let count = 0;
let bytes = 0;
for (const file of files) {
  const input = path.join(dir, file);
  const { width = 0 } = await sharp(input).metadata();
  for (const w of WIDTHS) {
    const out = path.join(dir, file.replace(/\.(jpe?g|png)$/i, `.w${w}.webp`));
    await sharp(input)
      .resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(out);
    bytes += (await stat(out)).size;
    count++;
  }
}
console.log(`Imágenes: ${files.length} originales → ${count} versiones WebP (${(bytes / 1048576).toFixed(1)} MB)`);
