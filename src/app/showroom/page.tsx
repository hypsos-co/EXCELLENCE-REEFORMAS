import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { SHOWROOM_CATEGORIES, SHOWROOM_PHOTOS } from "@/content/showroom";
import { ShowroomGallery } from "@/components/showroom/ShowroomGallery";
import { LogoHouses } from "@/components/brand/Logo";
import { CtaLink } from "@/components/site/CtaLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { IconInstagram } from "@/components/icons";

export const metadata: Metadata = {
  title: "Showroom · Reformas reales",
  description:
    "Galería de reformas terminadas por Excellence Reformas: salones, cocinas, baños, vestidores, pasillos y espacios de trabajo en Madrid y alrededores.",
  alternates: { canonical: "/showroom" },
};

const COVER = ["vestibulo-suelo-vidrio", "cocina-isla-pilares-madera", "bano-celosias-madera"];

export default function ShowroomPage() {
  const cover = COVER.map((id) => SHOWROOM_PHOTOS.find((p) => p.id === id)!);
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-white">
        {/* Cabecera */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-end gap-10 px-5 pt-10 pb-12 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-16 lg:pb-16">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Showroom</p>
              <h1 className="font-display-tight mt-4 text-[3.4rem] leading-[0.9] text-navy uppercase sm:text-7xl xl:text-[5.4rem]">
                Reformas reales, <span className="text-steel">terminadas.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-ink">
                Una selección de nuestras obras: salones, cocinas, baños, vestidores, pasillos y espacios de trabajo. Pulsa cualquier foto
                para verla en grande.
              </p>
              <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
                <Stat value={String(SHOWROOM_PHOTOS.length)} label="fotografías" />
                <Stat value={String(SHOWROOM_CATEGORIES.length)} label="tipos de espacio" />
                <Stat value="Madrid" label="y alrededores" />
              </ul>
            </div>
            <div className="grid grid-cols-[1.25fr_1fr] gap-3 sm:gap-4" aria-hidden="true">
              <div className="relative row-span-2 min-h-full overflow-hidden rounded-3xl bg-mist shadow-lift">
                <Image src={cover[0].src} alt="" fill preload placeholder="blur" sizes="(min-width: 1024px) 26vw, 52vw" className="object-cover" />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist shadow-card">
                <Image src={cover[1].src} alt="" fill placeholder="blur" sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist shadow-card">
                <Image src={cover[2].src} alt="" fill placeholder="blur" sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Galería */}
        <section aria-label="Galería" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
          <ShowroomGallery photos={SHOWROOM_PHOTOS} categories={SHOWROOM_CATEGORIES} />
        </section>

        {/* Llamada a la acción */}
        <section className="px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy px-6 py-14 text-white sm:px-12 lg:px-16 lg:py-20">
            <LogoHouses className="pointer-events-none absolute -right-20 -bottom-8 -z-10 w-[40rem] text-white/[0.05]" />
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div>
                <h2 className="font-display-tight text-5xl leading-[0.92] uppercase sm:text-6xl">¿Quieres un resultado así en tu casa?</h2>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
                  Cuéntanos qué quieres transformar y {siteConfig.owner} estudiará tu proyecto personalmente.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <CtaLink variant="light" size="lg">
                  Solicitar presupuesto
                </CtaLink>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ring-1 ring-white/30 transition hover:bg-white/10"
                >
                  <IconInstagram size={20} />
                  Más trabajos en Instagram
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li>
      <span className="font-display-tight block text-4xl leading-none text-navy uppercase">{value}</span>
      <span className="mt-1 block text-sm text-steel-ink">{label}</span>
    </li>
  );
}
