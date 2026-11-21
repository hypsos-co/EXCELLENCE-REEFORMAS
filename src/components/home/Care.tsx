import Link from "next/link";
import { siteConfig } from "@/config/site";
import { IconArrowRight, IconBook, IconStar, IconTool } from "@/components/icons";
import { SocialLinks } from "@/components/site/SocialLinks";

/** Portada: cuidado del cliente después de la obra (fidelización). */
export function Care() {
  const items = [
    { href: "/valoracion", icon: <IconStar size={24} />, title: "¿Cómo va todo?", text: "Valora tu experiencia en cualquier momento de la obra." },
    { href: "/clientes#posventa", icon: <IconTool size={24} />, title: "Revisiones y ayuda", text: "Si algo necesita un ajuste después de la obra, lo vemos." },
    { href: "/clientes#cuidados", icon: <IconBook size={24} />, title: "Cuida tu reforma", text: "Consejos para que todo luzca como el primer día." },
  ];
  return (
    <section aria-labelledby="cuidamos-titulo" className="bg-mist-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Área de clientes</p>
            <h2 id="cuidamos-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">
              Te cuidamos también después
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-steel-ink">
              Una reforma no termina al entregar las llaves. {siteConfig.owner} sigue a tu lado para lo que necesites.
            </p>
          </div>
          <Link href="/clientes" className="group inline-flex min-h-13 items-center gap-2 rounded-full bg-navy px-6 font-extrabold text-white shadow-lift transition hover:bg-navy-800">
            Ir al área de clientes
            <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((i) => (
            <li key={i.href}>
              <Link href={i.href} className="group flex h-full flex-col gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy/6 transition hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-2xl bg-mist text-navy">{i.icon}</span>
                <span>
                  <span className="flex items-center justify-between text-lg font-bold text-navy">
                    {i.title}
                    <IconArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="mt-1 block text-[15px] text-steel-ink">{i.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <p className="mb-3 text-sm font-bold tracking-[0.14em] text-steel-ink uppercase">Síguenos</p>
          <SocialLinks withGoogle />
        </div>
      </div>
    </section>
  );
}
