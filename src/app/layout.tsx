import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl, siteConfig } from "@/config/site";
import hero from "@/assets/obras/hero.jpg";
import "./globals.css";

const manrope = localFont({
  src: "../fonts/manrope-latin-wght.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

const archivo = localFont({
  src: "../fonts/archivo-latin-wdth.woff2",
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${siteConfig.name} · Reformas en ${siteConfig.serviceArea.label}`,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    "Reformas integrales, cocinas, baños, pintura y albañilería en Madrid y alrededores. Cuéntanos tu proyecto con Excellence Smart Budget. Tu casa también merece un Glow Up.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: siteConfig.name,
    images: [{ url: hero.src, width: hero.width, height: hero.height, alt: "Salón reformado por Excellence Reformas" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#102B49",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${manrope.variable} ${archivo.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
