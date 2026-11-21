"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IconCheck, IconDownload, IconShare } from "@/components/icons";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const noop = () => () => {};
const platform = () => {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone ? "installed" : ios ? "ios" : "other";
};

/** Botón «Instalar la app» (Android/ordenador) o instrucciones para iPhone. */
export function InstallApp() {
  const kind = useSyncExternalStore(noop, platform, () => null);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (kind === null) return null;
  if (kind === "installed" || done) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
        <IconCheck size={16} /> App instalada en este dispositivo
      </p>
    );
  }
  if (prompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          await prompt.prompt();
          const choice = await prompt.userChoice;
          if (choice.outcome === "accepted") setDone(true);
          setPrompt(null);
        }}
        className="inline-flex min-h-13 items-center gap-2.5 rounded-full bg-white px-6 font-extrabold text-navy shadow-lift transition hover:bg-mist"
      >
        <IconDownload size={20} /> Instalar la app
      </button>
    );
  }
  return (
    <p className="flex max-w-md items-start gap-2.5 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/90 ring-1 ring-white/20">
      <IconShare size={18} className="mt-0.5 shrink-0" />
      {kind === "ios" ? (
        <span>
          <strong>Llévanos en tu iPhone:</strong> pulsa <em>Compartir</em> y después «Añadir a pantalla de inicio».
        </span>
      ) : (
        <span>
          <strong>Llévanos en tu móvil:</strong> en el menú del navegador, elige «Instalar aplicación» o «Añadir a pantalla de inicio».
        </span>
      )}
    </p>
  );
}
