"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { IconClose, IconMenu } from "@/components/icons";
import { cx } from "@/lib/cx";
import { CtaLink } from "./CtaLink";

const NAV = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/showroom", label: "Showroom" },
  { href: "/#sobre-mi", label: "Sobre mí" },
  { href: "/#como-trabajamos", label: "Cómo trabajamos" },
  { href: "/#contacto", label: "Contacto" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cx(
        "sticky top-0 z-40 transition-[background-color,box-shadow] duration-300",
        scrolled || open ? "bg-white/92 shadow-[0_1px_0_rgb(16_43_73/0.08)] backdrop-blur-md" : "bg-white",
      )}
    >
      <a
        href="#contenido"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
        <Link href="/" aria-label="Excellence Reformas, inicio" className="shrink-0 rounded-md">
          <Logo className="h-11 w-auto text-navy lg:h-13" decorative />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rounded-full px-4 py-2.5 text-[15px] font-semibold text-navy/80 transition hover:bg-mist hover:text-navy"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="sm:hidden">
            <CtaLink size="sm" arrow={false} className="px-4">
              Presupuesto
            </CtaLink>
          </span>
          <span className="hidden sm:block">
            <CtaLink size="sm">Solicitar presupuesto</CtaLink>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid size-11 place-items-center rounded-full text-navy ring-1 ring-navy/15 transition hover:ring-navy lg:hidden"
          >
            {open ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-navy/8 bg-white px-5 pt-4 pb-10 lg:hidden"
          >
            <nav aria-label="Menú móvil">
              <ul className="divide-y divide-navy/8">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="font-display-tight block py-4 text-3xl text-navy uppercase"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <CtaLink size="lg" className="mt-8 w-full">
              Solicitar presupuesto
            </CtaLink>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
