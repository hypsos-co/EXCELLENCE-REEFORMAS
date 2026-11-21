"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { IconCheck, IconShare } from "@/components/icons";
import { cx } from "@/lib/cx";

const TEXT = `Te recomiendo ${siteConfig.name}: reformas en ${siteConfig.serviceArea.label}. ${siteConfig.tagline}`;

/** «Recomienda a un amigo»: comparte la web con el menú del móvil, WhatsApp o copiando el enlace. */
export function ShareButton({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin + "/";
    if (navigator.share) {
      try {
        await navigator.share({ title: siteConfig.name, text: TEXT, url });
        return;
      } catch {
        /* el usuario canceló: no hacemos nada */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${TEXT} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${TEXT} ${url}`)}`, "_blank", "noopener");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cx(
        "inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full px-6 font-extrabold transition",
        tone === "dark" ? "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20" : "bg-white text-navy ring-1 ring-navy/15 hover:ring-navy",
        className,
      )}
    >
      {copied ? <IconCheck size={20} /> : <IconShare size={20} />}
      <span aria-live="polite">{copied ? "Enlace copiado" : "Recomendar a un amigo"}</span>
    </button>
  );
}
