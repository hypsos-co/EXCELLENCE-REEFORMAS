import Image from "next/image";
import { aboutConfig } from "@/config/about";
import { siteConfig } from "@/config/site";
import { LogoHouses } from "@/components/brand/Logo";
import { IconCheck, IconSpark } from "@/components/icons";
import { CtaLink } from "@/components/site/CtaLink";
import portrait from "@/assets/equipo/julio-cesar.jpg";

export function About() {
  const a = aboutConfig;
  return (
    <section id="sobre-mi" aria-labelledby="sobre-mi-titulo" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-3 -z-0 rotate-[-2.5deg] rounded-[2.25rem] bg-mist sm:-inset-4" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy shadow-lift">
            <Image
              src={portrait}
              alt={`${siteConfig.owner}, de Excellence Reformas, sonriendo con un micrófono en la mano`}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 90vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-2 -bottom-6 flex items-center gap-3 rounded-2xl bg-navy px-5 py-4 text-white shadow-lift sm:-right-6">
            <LogoHouses className="h-5 w-auto text-steel-soft" />
            <span className="text-sm leading-tight font-bold">
              Te atiende
              <br />
              personalmente
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">{a.eyebrow}</p>
          <h2 id="sobre-mi-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">
            {a.title}
          </h2>
          <p className="mt-6 text-xl leading-relaxed font-semibold text-navy">{a.lead}</p>
          {a.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 text-lg leading-relaxed text-steel-ink">
              {p}
            </p>
          ))}

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {a.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 rounded-2xl bg-mist-50 p-4 text-[15px] font-semibold text-navy ring-1 ring-navy/8">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-navy text-white">
                  <IconCheck size={12} strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <CtaLink>Cuéntame tu proyecto</CtaLink>
            <p className="flex items-center gap-2 text-[15px] text-steel-ink">
              <IconSpark size={18} className="text-steel" />
              <span>
                <strong className="font-bold text-navy">{a.signature}</strong> · {a.role}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
