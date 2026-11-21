"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { RATING_LABELS } from "@/lib/forms/feedback";
import { IconStar } from "@/components/icons";
import { cx } from "@/lib/cx";

/**
 * Valoración de 0 a 5 estrellas (0 = sin valorar).
 * Son botones de opción nativos: se manejan con ratón, toque o flechas del teclado.
 */
export function StarRating({
  value,
  onChange,
  id,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  id: string;
  error?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset aria-describedby={`${id}-label${error ? ` ${id}-error` : ""}`}>
      <legend className="sr-only">Puntuación de 1 a 5 estrellas</legend>
      <div className="flex items-center gap-1 sm:gap-2" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= shown;
          return (
            <label key={n} className="relative cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                id={n === 1 ? id : undefined}
                type="radio"
                name="rating"
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}: ${RATING_LABELS[n]}`}
                className="peer sr-only"
              />
              <motion.span
                animate={{ scale: value === n ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.35 }}
                className={cx(
                  "grid size-13 place-items-center rounded-2xl transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-steel sm:size-16",
                  active ? "text-[#F2B01E]" : "text-navy/20 hover:text-navy/35",
                )}
              >
                <IconStar size={44} filled={active} strokeWidth={active ? 1.2 : 1.6} />
              </motion.span>
            </label>
          );
        })}
      </div>
      <p id={`${id}-label`} className="mt-3 h-6 text-lg font-bold text-navy" aria-live="polite">
        {shown ? `${shown}/5 · ${RATING_LABELS[shown]}` : <span className="font-medium text-steel-ink">Pulsa una estrella (0/5)</span>}
      </p>
    </fieldset>
  );
}
