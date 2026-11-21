"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { IconArrowLeft, IconCheck, IconInstagram, IconWhatsApp } from "@/components/icons";
import { DEFAULT_MEDIA } from "./media";

export function SuccessScreen({
  firstName,
  reference,
  whatsappUrl,
}: {
  firstName: string;
  reference: string;
  whatsappUrl: string | null;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-navy-950 text-white">
      <Image src={DEFAULT_MEDIA.src} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" placeholder="blur" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/70 via-navy-950/85 to-navy-950" />

      <header className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
        <Link href="/" aria-label="Excellence Reformas, ir al inicio" className="rounded-md">
          <Logo className="h-12 w-auto text-white sm:h-14" decorative />
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid size-20 place-items-center rounded-full bg-white text-navy shadow-lift"
        >
          <IconCheck size={40} strokeWidth={2.5} />
        </motion.span>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <h1 ref={headingRef} tabIndex={-1} className="font-display-tight mt-8 text-4xl leading-[0.95] uppercase outline-none sm:text-6xl">
            ¡Gracias por confiar en Excellence Reformas!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            {firstName ? `${firstName}, tu` : "Tu"} proyecto nos interesa. Ahora puedes continuar la conversación directamente con{" "}
            {siteConfig.owner}.
          </p>

          <p className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/20">
            Solicitud registrada · Referencia <strong className="font-bold tracking-wider">{reference}</strong>
          </p>

          <div className="mt-9 flex flex-col items-center gap-3">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-8 text-base font-extrabold tracking-wide text-navy uppercase shadow-lift transition hover:bg-mist focus-visible:outline-white"
              >
                <IconWhatsApp size={24} className="text-[#1FAF54]" />
                Continuar por WhatsApp
                <span className="sr-only">(se abre WhatsApp)</span>
              </a>
            ) : (
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-8 text-base font-extrabold tracking-wide text-navy uppercase shadow-lift transition hover:bg-mist"
              >
                <IconInstagram size={22} />
                Ver nuestros trabajos en Instagram
              </a>
            )}
            <Link
              href="/"
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              <IconArrowLeft size={18} />
              Volver a la web
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-steel-soft">
            Guarda tu referencia: te ayudará a identificar tu proyecto cuando hables con nosotros.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
