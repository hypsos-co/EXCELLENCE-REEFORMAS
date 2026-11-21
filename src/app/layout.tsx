import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl, hasPublicSiteUrl, siteConfig } from "@/config/site";
import hero from "@/assets/obras/hero.jpg";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { PwaRegister } from "@/components/site/PwaRegister";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Excellence", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: siteConfig.name,
    // Solo con una dirección pública real: si no, la imagen apuntaría a localhost.
    images: hasPublicSiteUrl()
      ? [{ url: hero.src, width: hero.width, height: hero.height, alt: "Salón reformado por Excellence Reformas" }]
      : undefined,
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
    <html lang="es" data-scroll-behavior="smooth" className={`${manrope.variable} ${archivo.variable}`}>
      <body className="min-h-dvh">
        {children}
        <WhatsAppButton />
        <PwaRegister />
      </body>
    </html>
  );
}
