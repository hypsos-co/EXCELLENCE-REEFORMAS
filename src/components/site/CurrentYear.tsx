"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Año en curso. Se lee solo en el navegador (en el prerenderizado no se puede
 * usar la fecha actual), así sirve igual para la versión estática y la de servidor.
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    noop,
    () => new Date().getFullYear(),
    () => null,
  );
  return <span>{year ?? ""}</span>;
}
