"use client";

import type { ReactNode } from "react";
import { IconCheck } from "@/components/icons";
import { FieldError } from "@/components/budget/ui";
import { cx } from "@/lib/cx";

/** Casilla de verificación grande y accesible. */
export function CheckField({
  id,
  checked,
  onChange,
  children,
  error,
  tone = "default",
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string;
  tone?: "default" | "highlight";
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cx(
          "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition",
          error ? "border-danger bg-danger/4" : tone === "highlight" ? "border-steel/50 bg-mist" : "border-navy/12 bg-mist-50 hover:border-navy/30",
        )}
      >
        <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-navy/35 bg-white transition checked:border-navy checked:bg-navy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-steel"
          />
          <IconCheck size={16} strokeWidth={3} className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="text-[15px] leading-relaxed text-navy">{children}</span>
      </label>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
