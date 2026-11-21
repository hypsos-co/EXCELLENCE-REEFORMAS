import type { NextConfig } from "next";

/**
 * Dos formas de desplegar la web:
 *
 *  - Servidor Next.js (por defecto, `npm run build`): incluye el backend
 *    /api/solicitudes con email SMTP y almacenamiento privado.
 *  - HTML estático para Netlify (`npm run build:netlify`, STATIC_EXPORT=1):
 *    genera la carpeta `out/` y las solicitudes se reciben con Netlify Forms.
 */
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // La exportación estática no admite prerenderizado parcial (PPR).
  cacheComponents: !STATIC_EXPORT,
  partialPrefetching: !STATIC_EXPORT,
  poweredByHeader: false,
  // El backend (route.server.ts) solo forma parte de la versión con servidor.
  pageExtensions: STATIC_EXPORT ? ["tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js", "server.ts"],
  images: {
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    ...(STATIC_EXPORT ? { loader: "custom" as const, loaderFile: "./src/lib/image-loader.ts" } : {}),
  },
  ...(STATIC_EXPORT
    ? { output: "export" as const }
    : {
        async headers() {
          return [
            { source: "/:path*", headers: securityHeaders },
            { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
          ];
        },
      }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
