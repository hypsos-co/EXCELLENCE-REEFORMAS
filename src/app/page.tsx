import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { siteConfig, telHref } from "@/config/site";
import { REFORM_TYPES } from "@/lib/budget/options";
import { REFORM_MEDIA } from "@/components/budget/media";
import { LogoHouses } from "@/components/brand/Logo";
import { CtaLink, budgetHref } from "@/components/site/CtaLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { About } from "@/components/home/About";
import { SHOWROOM_PHOTOS } from "@/content/showroom";
import { Reviews } from "@/components/home/Reviews";
import { Care } from "@/components/home/Care";
import { HeroNight } from "@/components/home/night/HeroNight";
import avatar from "@/assets/equipo/julio-cesar-avatar.jpg";
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconClock,
  IconInstagram,
  IconMail,
  IconPhone,
  IconRuler,
  IconShield,
  IconSpark,
  IconWhatsApp,
} from "@/components/icons";
import cocinaFrontal from "@/assets/obras/cocina-frontal.jpg";
import duchaAlicatado from "@/assets/obras/ducha-alicatado.jpg";
import pasilloBano from "@/assets/obras/pasillo-bano.jpg";
import papelLed from "@/assets/obras/papel-led.jpg";
import columnas from "@/assets/obras/columnas.jpg";
import pinturaColumna from "@/assets/obras/pintura-columna.jpg";
import dormitorio from "@/assets/obras/dormitorio.jpg";
import salonSol from "@/assets/obras/salon-sol.jpg";

const WORKS: { src: StaticImageData; title: string; alt: string }[] = [
  { src: cocinaFrontal, title: "Cocina", alt: "Cocina blanca con frentes lacados sin tiradores y encimera clara" },
  { src: duchaAlicatado, title: "Baño", alt: "Baño con ducha y pared alicatada con azulejo tipo ladrillo en tono arena" },
  { src: pasilloBano, title: "Armarios empotrados", alt: "Pasillo con armarios empotrados blancos a ambos lados hacia el baño" },
  { src: papelLed, title: "Papel pintado e iluminación", alt: "Pared revestida con papel pintado de pájaros e iluminación LED indirecta" },
  { src: columnas, title: "Salón y cocina", alt: "Salón con columnas de hierro fundido negras y la cocina al fondo" },
  { src: pinturaColumna, title: "Pintura decorativa", alt: "Pilar pintado con rayas horizontales en arena y blanco" },
  { src: dormitorio, title: "Dormitorio", alt: "Dormitorio con armarios empotrados hasta el techo y hornacina iluminada" },
  { src: salonSol, title: "Reforma integral", alt: "Salón con suelo de madera oscura y luz natural entrando por el balcón" },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader overlay />
      <main id="contenido">
        <HeroNight />
        <TrustStrip />
        <Services />
        <SmartBudget />
        <Works />
        <Process />
        <About />
        <Reviews />
        <Care />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}

/* -------------------------- Franja de confianza -------------------------- */

function TrustStrip() {
  const items = [
    {
      icon: <Image src={avatar} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />,
      title: `Trato directo con ${siteConfig.owner}`,
      text: "Hablas siempre con quien hace la obra.",
    },
    { icon: <IconShield size={20} />, title: "Solicitud sin compromiso", text: "Cuéntanos tu idea y te orientamos." },
    { icon: <IconRuler size={20} />, title: "Sin medidas exactas", text: "Responde «No lo sé» y seguimos." },
    { icon: <IconClock size={20} />, title: "Unos 2 minutos", text: "Con fotos de tu espacio incluidas." },
  ];
  return (
    <section aria-label="Por qué Excellence Reformas" className="bg-white pt-10 lg:pt-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ul className="grid gap-px overflow-hidden rounded-3xl bg-navy/8 shadow-card ring-1 ring-navy/8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <li key={t.title} className="flex items-start gap-3.5 bg-white p-5 lg:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-navy">{t.icon}</span>
              <span>
                <strong className="block text-[15px] font-bold text-navy">{t.title}</strong>
                <span className="mt-0.5 block text-sm text-steel-ink">{t.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center justify-center gap-3 pt-10 pb-4 sm:flex-row">
          <CtaLink size="lg">Solicitar presupuesto</CtaLink>
          <CtaLink href="/showroom" variant="outline" arrow={false} className="min-h-15">
            Ver el showroom
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Servicios ------------------------------- */

function Services() {
  return (
    <section id="servicios" className="scroll-mt-24 bg-mist-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Servicios"
          title="¿Qué espacio quieres transformar?"
          text="Elige tu reforma y empieza la solicitud con ella ya seleccionada."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {REFORM_TYPES.map((t) => {
            const media = REFORM_MEDIA[t.id];
            return (
              <li key={t.id}>
                <Link
                  href={budgetHref(t.id)}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-mist shadow-card transition-shadow duration-300 hover:shadow-lift sm:aspect-[4/5]"
                >
                  <Image
                    src={media.src}
                    alt={media.alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-display-tight text-3xl uppercase">{t.label}</h3>
                    <p className="mt-1 text-[15px] text-white/80">{t.hint}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold">
                      Pedir presupuesto
                      <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------- Smart Budget ------------------------------ */

function SmartBudget() {
  const features = [
    { icon: <IconSpark size={22} />, title: "Preguntas que se adaptan", text: "Cada tipo de reforma tiene sus propias preguntas, sin campos innecesarios." },
    { icon: <IconRuler size={22} />, title: "Sin medidas exactas", text: "¿No sabes cuántos metros tiene? Elige «No lo sé» y seguimos." },
    { icon: <IconCamera size={22} />, title: "Fotos de tu espacio", text: "Adjunta el estado actual o imágenes de inspiración. Se envían de forma privada." },
    {
      icon: <IconWhatsApp size={22} />,
      title: "Directo a Excellence Reformas",
      text: `Tu solicitud llega a ${siteConfig.owner}, y puedes seguir la conversación por WhatsApp.`,
    },
  ];
  return (
    <section className="relative overflow-hidden bg-navy py-20 text-white lg:py-28">
      <LogoHouses className="pointer-events-none absolute -right-24 -bottom-10 w-[46rem] text-white/[0.04]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-steel-soft uppercase">Excellence Smart Budget</p>
          <h2 className="font-display-tight mt-4 text-5xl leading-[0.92] uppercase sm:text-6xl">
            Cuéntanos tu proyecto en unos 2 minutos
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
            Un asistente guiado, paso a paso, para que nos expliques qué quieres reformar sin rellenar formularios interminables. Revisas el
            resumen y nos lo envías con un clic.
          </p>
          <CtaLink variant="light" size="lg" className="mt-9">
            Empezar mi Glow Up
          </CtaLink>
          <p className="mt-4 text-sm text-steel-soft">No es un presupuesto automático: estudiamos cada proyecto de forma personalizada.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f.title} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/12 backdrop-blur-sm">
              <span className="grid size-12 place-items-center rounded-2xl bg-white text-navy">{f.icon}</span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/75">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- Trabajos -------------------------------- */

function Works() {
  return (
    <section id="trabajos" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Trabajos reales" title="Obras terminadas" text="Algunas de nuestras reformas terminadas." />
          <CtaLink href="/showroom" variant="outline" size="md">
            Ver el showroom completo
          </CtaLink>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {WORKS.map((w, i) => (
            <li key={w.title} className={i % 4 === 1 || i % 4 === 3 ? "lg:translate-y-10" : undefined}>
              <figure className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-mist shadow-card sm:rounded-3xl">
                <Image
                  src={w.src}
                  alt={w.alt}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 24vw, 46vw"
                  className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <figcaption className="absolute inset-x-2 bottom-2 rounded-xl bg-white/92 px-3 py-2 text-sm font-bold text-navy backdrop-blur sm:inset-x-3 sm:bottom-3">
                  {w.title}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex justify-center lg:mt-20">
          <CtaLink href="/showroom" size="lg">
            Ver las {SHOWROOM_PHOTOS.length} fotos del showroom
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Proceso --------------------------------- */

function Process() {
  const steps = [
    { title: "Cuéntanos tu proyecto", text: "Con Excellence Smart Budget: tipo de reforma, detalles, fotos y cómo contactarte." },
    { title: "Lo estudiamos", text: `${siteConfig.owner} revisa tu solicitud y las fotos para entender bien lo que necesitas.` },
    { title: "Hablamos contigo", text: "Te contactamos para resolver dudas y concretar los detalles de la obra." },
    { title: "Tu presupuesto", text: "Personalizado para tu proyecto: nunca un precio automático." },
  ];
  return (
    <section id="como-trabajamos" className="scroll-mt-24 bg-mist-50 py-20 lg:pt-36 lg:pb-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Cómo trabajamos" title="De la idea a tu Glow Up" />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy/6">
              <span className="font-display-tight text-6xl leading-none text-steel/50" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-steel-ink">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------- Contacto -------------------------------- */

function Contact() {
  const { phone, whatsapp, email } = siteConfig.contact;
  const channels = [
    phone && { href: telHref(phone), icon: <IconPhone size={20} />, label: phone, external: false },
    whatsapp && { href: `https://wa.me/${whatsapp}`, icon: <IconWhatsApp size={20} />, label: "WhatsApp", external: true },
    email && { href: `mailto:${email}`, icon: <IconMail size={20} />, label: email, external: false },
    { href: siteConfig.social.instagram, icon: <IconInstagram size={20} />, label: siteConfig.social.instagramHandle, external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; external: boolean }[];

  return (
    <section id="contacto" className="scroll-mt-24 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-14 text-white sm:px-12 lg:px-16 lg:py-20">
          <Image src={REFORM_MEDIA.integral.src} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-10 object-cover opacity-30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-950/50" />
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-steel-soft uppercase">Contacto</p>
              <h2 className="font-display-tight mt-4 text-5xl leading-[0.92] uppercase sm:text-6xl">¿Empezamos tu Glow Up?</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
                Cuéntanos qué quieres transformar. Trabajamos en {siteConfig.serviceArea.label}; si estás en otra zona, escríbenos igualmente.
              </p>
              <CtaLink variant="light" size="lg" className="mt-8">
                Quiero transformar mi hogar
              </CtaLink>
            </div>
            <ul className="space-y-3">
              {channels.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/[0.07] px-5 text-[15px] font-semibold ring-1 ring-white/15 transition hover:bg-white/12"
                  >
                    <span className="text-steel-soft">{c.icon}</span>
                    {c.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-3 px-5 pt-1 text-sm text-steel-soft">
                <IconCheck size={16} /> Cada solicitud llega directamente a {siteConfig.owner}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Utilidades ------------------------------ */

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">{eyebrow}</p>
      <h2 className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-steel-ink">{text}</p>}
    </div>
  );
}
