"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { hasWhatsApp, siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import { IconClose, IconWhatsApp } from "@/components/icons";

/** Rutas donde el botón estorbaría (el asistente tiene su propia barra inferior y su botón de WhatsApp al final). */
const HIDDEN_ON = ["/solicitar-presupuesto"];
const TIP_KEY = "er-wa-tip-cerrado";

/**
 * Botón flotante de WhatsApp, animado, en todas las páginas.
 * Abre una conversación con el número configurado en src/config/site.ts.
 * Si no hay número configurado, no se muestra.
 */
export function WhatsAppButton() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [tip, setTip] = useState(false);

  useEffect(() => {
    let closed = false;
    try {
      closed = sessionStorage.getItem(TIP_KEY) === "1";
    } catch {
      /* almacenamiento no disponible: se muestra igualmente */
    }
    if (closed) return;
    const t = setTimeout(() => setTip(true), 4500);
    return () => clearTimeout(t);
  }, []);

  if (!hasWhatsApp() || HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;
  const href = buildWhatsAppUrl(siteConfig.contact.whatsapp, siteConfig.whatsappMessage);
  if (!href) return null;

  const closeTip = () => {
    setTip(false);
    try {
      sessionStorage.setItem(TIP_KEY, "1");
    } catch {
      /* sin almacenamiento */
    }
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {tip && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative mb-2 max-w-[15rem] rounded-2xl rounded-br-md bg-white py-3 pr-9 pl-4 text-sm leading-snug text-navy shadow-lift ring-1 ring-navy/8"
          >
            <strong className="block font-bold">¿Hablamos?</strong>
            Escribe a {siteConfig.owner} por WhatsApp y te responde directamente.
            <button
              type="button"
              onClick={closeTip}
              aria-label="Cerrar aviso de WhatsApp"
              className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full text-steel-ink hover:bg-mist"
            >
              <IconClose size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Hablar por WhatsApp con ${siteConfig.owner} (se abre WhatsApp)`}
        onClick={closeTip}
        initial={reduce ? false : { opacity: 0, scale: 0.4, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: reduce ? 0 : 1 }}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="group pointer-events-auto relative grid size-16 place-items-center rounded-full bg-[#1FAF54] text-white shadow-[0_10px_30px_-8px_rgb(31_175_84/0.65)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1FAF54]"
      >
        {/* Ondas animadas */}
        <span aria-hidden="true" className="wa-ring absolute inset-0 rounded-full bg-[#1FAF54]" />
        <span aria-hidden="true" className="wa-ring wa-ring-delay absolute inset-0 rounded-full bg-[#1FAF54]" />
        <span aria-hidden="true" className="wa-wiggle relative">
          <IconWhatsApp size={32} />
        </span>
      </motion.a>
    </div>
  );
}
