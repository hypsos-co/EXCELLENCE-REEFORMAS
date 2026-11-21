import Link from "next/link";
import { cacheLife } from "next/cache";
import { siteConfig, telHref } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { IconInstagram, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/icons";
import { CtaLink } from "./CtaLink";

export function SiteFooter() {
  const { phone, whatsapp, email } = siteConfig.contact;
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-16 pb-10 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] lg:pt-20">
        <div>
          <Logo className="h-20 w-auto text-white" />
          <p className="font-display-tight mt-6 max-w-xs text-2xl leading-tight uppercase">{siteConfig.tagline}</p>
          <CtaLink variant="light" size="sm" className="mt-6">
            Cuéntanos tu proyecto
          </CtaLink>
        </div>

        <div>
          <h2 className="text-xs font-bold tracking-[0.18em] text-steel-soft uppercase">Contacto</h2>
          <ul className="mt-4 space-y-3 text-[15px]">
            <li className="flex items-center gap-2.5 text-white/85">
              <IconPin size={18} className="text-steel-soft" />
              {siteConfig.serviceArea.label}
            </li>
            {phone && (
              <li>
                <a href={telHref(phone)} className="flex items-center gap-2.5 text-white/85 hover:text-white">
                  <IconPhone size={18} className="text-steel-soft" />
                  {phone}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/85 hover:text-white">
                  <IconWhatsApp size={18} className="text-steel-soft" />
                  WhatsApp
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-white/85 hover:text-white">
                  <IconMail size={18} className="text-steel-soft" />
                  {email}
                </a>
              </li>
            )}
            <li>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/85 hover:text-white"
              >
                <IconInstagram size={18} className="text-steel-soft" />
                {siteConfig.social.instagramHandle}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold tracking-[0.18em] text-steel-soft uppercase">Explora</h2>
          <ul className="mt-4 space-y-3 text-[15px]">
            <li>
              <Link href="/#servicios" className="text-white/85 hover:text-white">
                Servicios
              </Link>
            </li>
            <li>
              <Link href="/showroom" className="text-white/85 hover:text-white">
                Showroom
              </Link>
            </li>
            <li>
              <Link href="/#sobre-mi" className="text-white/85 hover:text-white">
                Sobre mí
              </Link>
            </li>
            <li>
              <Link href="/solicitar-presupuesto" className="text-white/85 hover:text-white">
                Solicitar presupuesto
              </Link>
            </li>
            <li>
              <Link href="/politica-de-privacidad" className="text-white/85 hover:text-white">
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-6 text-sm text-steel-soft sm:px-8">
          © <CopyrightYear /> {siteConfig.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

/** Año en curso, cacheado (con Cache Components no se puede leer la fecha durante el prerender). */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
