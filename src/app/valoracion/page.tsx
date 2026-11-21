import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { FeedbackForm } from "@/components/forms/FeedbackForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SocialLinks } from "@/components/site/SocialLinks";
import avatar from "@/assets/equipo/julio-cesar-avatar.jpg";

export const metadata: Metadata = {
  title: "Valora tu experiencia",
  description: "Cuéntanos cómo te estamos atendiendo. Tu opinión llega directamente a Julio César, de Excellence Reformas.",
  alternates: { canonical: "/valoracion" },
};

export default function ValoracionPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-10 pb-24 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:pt-16">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Tu opinión</p>
            <h1 className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">¿Cómo lo estamos haciendo?</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel-ink">
              Queremos que te sientas bien atendido en todo momento. Valora tu experiencia en un minuto: nos ayuda a cuidarte mejor.
            </p>
            <div className="mt-10">
              <FeedbackForm socials={<SocialLinks tone="dark" withGoogle />} />
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl bg-mist-50 p-6 ring-1 ring-navy/8">
              <div className="flex items-center gap-4">
                <Image src={avatar} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />
                <div>
                  <p className="text-lg font-bold text-navy">{siteConfig.owner}</p>
                  <p className="text-sm text-steel-ink">{siteConfig.name}</p>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-navy">
                «Leo personalmente cada valoración. Si algo no va como esperabas, quiero saberlo para solucionarlo contigo.»
              </p>
            </div>
            <div className="rounded-3xl bg-navy p-6 text-white">
              <p className="text-sm font-bold tracking-[0.14em] text-steel-soft uppercase">Síguenos</p>
              <p className="mt-2 mb-4 text-[15px] text-white/80">Mira nuestras obras más recientes y comparte la tuya.</p>
              <SocialLinks tone="dark" withGoogle />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
