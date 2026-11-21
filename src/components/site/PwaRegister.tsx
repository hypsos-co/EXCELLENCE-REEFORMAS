"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción) para que la web se pueda instalar como app. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
