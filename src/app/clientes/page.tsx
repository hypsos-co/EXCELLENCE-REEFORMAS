import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { hasWhatsApp, siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import { CARE_GUIDE } from "@/content/care-guide";
import { AftercareForm } from "@/components/forms/AftercareForm";
import { ShareButton } from "@/components/forms/ShareButton";
import { InstallApp } from "@/components/clientes/InstallApp";
import { LogoHouses } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SocialLinks } from "@/components/site/SocialLinks";
import { budgetHref } from "@/components/site/CtaLink";
import { IconArrowRight, IconBook, IconSpark, IconStar, IconTool, IconWhatsApp } from "@/components/icons";
import avatar from "@/assets/equipo/julio-cesar-avatar.jpg";

export const metadata: Metadata = {
  title: "Área de clientes",
  description:
    "Te cuidamos antes, durante y después de tu reforma: habla con Julio César, valora tu experiencia, pide una revisión y consulta cómo cuidar tu casa.",
  alternates: { canonical: "/clientes" },
};

export default function ClientesPage() {
  const wa = hasWhatsApp()
    ? buildWhatsAppUrl(siteConfig.contact.whatsapp, `Hola ${siteConfig.owner}, soy cliente de Excellence Reformas y os escribo desde el área de clientes.`)
    : null;

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-white">
        {/* Cabecera */}
        <section className="relative isolate overflow-hidden bg-navy text-white">
          <LogoHouses className="pointer-events-none absolute -right-24 -bottom-10 -z-10 w-[46rem] text-white/[0.05]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-20">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-steel-soft uppercase">Área de clientes · Excellence Care</p>
              <h1 className="font-display-tight mt-4 text-5xl leading-[0.92] uppercase sm:text-6xl xl:text-7xl">
                Te cuidamos antes, durante y <span className="text-steel-soft">después</span> de tu reforma.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                Todo lo que necesitas en un solo sitio: hablar con {siteConfig.owner}, contarnos cómo va todo, pedir una revisión y
                saber cómo cuidar tu casa.
              </p>
              <div className="mt-8">
                <InstallApp />
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/15 backdrop-blur">
              <Image src={avatar} alt="" width={72} height={72} className="size-18 rounded-full object-cover ring-2 ring-white/30" />
              <p className="text-[15px] leading-relaxed text-white/90">
                <strong className="block text-lg text-white">{siteConfig.owner}</strong>
                Estoy a tu disposición durante toda la obra y también después.
              </p>
            </div>
          </div>
        </section>

        {/* Accesos rápidos */}
        <section aria-labelledby="accesos" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <h2 id="accesos" className="sr-only">
            Accesos rápidos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wa && (
              <Card href={wa} external icon={<IconWhatsApp size={26} />} accent title={`Habla con ${siteConfig.owner}`} text="Escríbenos por WhatsApp y te respondemos directamente." />
            )}
            <Card href="/valoracion" icon={<IconStar size={26} />} title="¿Cómo va todo?" text="Valora tu experiencia de 0 a 5 estrellas. Queremos que te sientas bien atendido." />
            <Card href="#posventa" icon={<IconTool size={26} />} title="Pedir una revisión o ayuda" text="Una junta, un ajuste, una duda… Cuéntanoslo y lo vemos." />
            <Card href="#cuidados" icon={<IconBook size={26} />} title="Cómo cuidar tu reforma" text="Consejos sencillos para que todo luzca como el primer día." />
            <Card href={budgetHref()} icon={<IconSpark size={26} />} title="Tu próximo Glow Up" text="¿Otra estancia que transformar? Cuéntanos tu nuevo proyecto." />
            <li className="flex flex-col justify-between gap-5 rounded-3xl bg-mist-50 p-6 ring-1 ring-navy/8">
              <div>
                <p className="text-lg font-bold text-navy">Recomienda Excellence Reformas</p>
                <p className="mt-1 text-[15px] text-steel-ink">¿Conoces a alguien que quiera reformar? Compártenos en un toque.</p>
              </div>
              <ShareButton />
            </li>
          </ul>
        </section>

        {/* Posventa */}
        <section id="posventa" aria-labelledby="posventa-titulo" className="scroll-mt-24 bg-mist-50 py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Posventa</p>
              <h2 id="posventa-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase">
                ¿Necesitas una revisión o ayuda?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-steel-ink">
                Si algo no está como debería, o tienes una duda sobre el mantenimiento, cuéntanoslo. Es más fácil solucionarlo a tiempo.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy/8 sm:p-8">
              <AftercareForm />
            </div>
          </div>
        </section>

        {/* Guía de cuidados */}
        <section id="cuidados" aria-labelledby="cuidados-titulo" className="scroll-mt-24 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Guía de cuidados</p>
            <h2 id="cuidados-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase">
              Cómo cuidar tu reforma
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-steel-ink">
              Consejos generales para que tu casa luzca como el primer día. Sigue siempre las indicaciones del fabricante de cada material y,
              ante cualquier duda, pregúntanos.
            </p>
            <div className="mt-8 divide-y divide-navy/10 rounded-3xl bg-white ring-1 ring-navy/10">
              {CARE_GUIDE.map((t) => (
                <details key={t.id} className="group px-5 sm:px-7 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold text-navy">
                    {t.title}
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mist text-navy transition group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="text-[15px] text-steel-ink">{t.intro}</p>
                  <ul className="mt-3 mb-6 space-y-2.5">
                    {t.tips.map((tip) => (
                      <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-navy">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-steel" aria-hidden="true" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Redes */}
        <section className="px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 rounded-[2rem] bg-navy px-6 py-12 text-white sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display-tight text-4xl leading-[0.95] uppercase sm:text-5xl">Síguenos y forma parte</h2>
              <p className="mt-3 max-w-lg text-[15px] text-white/80">Nuestras obras más recientes, ideas y consejos para tu casa.</p>
            </div>
            <SocialLinks tone="dark" withGoogle />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Card({ href, icon, title, text, external, accent }: { href: string; icon: ReactNode; title: string; text: string; external?: boolean; accent?: boolean }) {
  const cls = `group flex h-full flex-col justify-between gap-6 rounded-3xl p-6 transition duration-300 ${
    accent ? "bg-[#1FAF54] text-white hover:brightness-105" : "bg-white text-navy shadow-card ring-1 ring-navy/8 hover:shadow-lift"
  }`;
  const inner = (
    <>
      <span className={`grid size-13 place-items-center rounded-2xl ${accent ? "bg-white/20" : "bg-mist"}`}>{icon}</span>
      <span>
        <span className="flex items-center justify-between gap-3 text-lg font-bold">
          {title}
          <IconArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
        </span>
        <span className={`mt-1 block text-[15px] ${accent ? "text-white/90" : "text-steel-ink"}`}>{text}</span>
      </span>
    </>
  );
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      )}
    </li>
  );
}
