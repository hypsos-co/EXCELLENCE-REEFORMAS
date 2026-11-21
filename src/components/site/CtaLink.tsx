import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowRight } from "@/components/icons";
import { cx } from "@/lib/cx";
import type { ReformType } from "@/lib/budget/options";

export const BUDGET_PATH = "/solicitar-presupuesto";

export function budgetHref(tipo?: ReformType) {
  return tipo ? `${BUDGET_PATH}?tipo=${tipo}` : BUDGET_PATH;
}

type Variant = "primary" | "light" | "outline" | "outline-light";

const styles: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-lift hover:bg-navy-800",
  light: "bg-white text-navy shadow-lift hover:bg-mist",
  outline: "text-navy ring-1 ring-navy/20 hover:ring-navy",
  "outline-light": "text-white ring-1 ring-white/35 hover:ring-white hover:bg-white/8",
};

/** Botón principal de conversión: lleva al asistente EXCELLENCE SMART BUDGET. */
export function CtaLink({
  children = "Solicitar presupuesto",
  href = BUDGET_PATH,
  variant = "primary",
  size = "md",
  arrow = true,
  className,
}: {
  children?: ReactNode;
  href?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group inline-flex items-center justify-center gap-2.5 rounded-full font-extrabold transition duration-200",
        size === "sm" && "min-h-11 px-5 text-sm",
        size === "md" && "min-h-13 px-7 text-[15px]",
        size === "lg" && "min-h-15 px-9 text-base tracking-wide uppercase",
        styles[variant],
        className,
      )}
    >
      {children}
      {arrow && <IconArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />}
    </Link>
  );
}
