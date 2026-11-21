"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { REFORM_TYPE_IDS, type ReformType } from "@/lib/budget/options";

/**
 * Lee `?tipo=cocina` de la URL (en el navegador) y preselecciona el tipo de
 * reforma. Funciona igual en la versión HTML estática y en el servidor.
 */
export function UrlPreselect({ onPick }: { onPick: (type: ReformType) => void }) {
  const params = useSearchParams();
  const tipo = params.get("tipo");
  useEffect(() => {
    if (tipo && (REFORM_TYPE_IDS as readonly string[]).includes(tipo)) onPick(tipo as ReformType);
    // Solo al cargar la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);
  return null;
}
