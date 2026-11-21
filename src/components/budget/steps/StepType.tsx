"use client";

import { AnimatePresence, motion } from "motion/react";
import { REFORM_TYPES, extraServicesFor, reformLabel } from "@/lib/budget/options";
import { REFORM_MEDIA } from "../media";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { Chip, FieldError, OptionCard } from "../ui";

export function StepType({ draft, dispatch, errors }: { draft: Draft; dispatch: (a: Action) => void; errors: FieldErrors }) {
  const primary = draft.reform.primary;
  const extras = extraServicesFor(primary);
  const error = errors["reform.primary"];
  const errId = `${fieldId("reform.primary")}-error`;

  return (
    <div className="space-y-8">
      <fieldset aria-describedby={error ? errId : undefined}>
        <legend className="sr-only">Tipo de reforma</legend>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {REFORM_TYPES.map((t, i) => {
            const media = REFORM_MEDIA[t.id];
            return (
              <OptionCard
                key={t.id}
                id={i === 0 ? fieldId("reform.primary") : undefined}
                name="reform"
                value={t.id}
                checked={primary === t.id}
                onChange={() => dispatch({ type: "setPrimary", value: t.id })}
                label={t.label}
                hint={t.hint}
                image={media.src}
                alt={media.alt}
                describedBy={error ? errId : undefined}
                sizes="(min-width: 1280px) 260px, (min-width: 1024px) 22vw, 46vw"
              />
            );
          })}
        </div>
        <FieldError id={errId}>{error}</FieldError>
      </fieldset>

      <AnimatePresence initial={false}>
        {extras.length > 0 && (
          <motion.div
            key="extras"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <fieldset className="rounded-2xl bg-mist-50 p-4 ring-1 ring-navy/8 sm:p-5">
              <legend className="float-left w-full text-base font-bold text-navy">
                ¿Necesitas algo más además de {reformLabel(primary).toLowerCase()}?
              </legend>
              <p className="clear-both pt-1 pb-4 text-sm text-steel-ink">
                Opcional. Añade otros trabajos si forman parte del mismo proyecto.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {extras.map((e) => (
                  <Chip
                    key={e}
                    type="checkbox"
                    name="extras"
                    value={e}
                    label={reformLabel(e)}
                    checked={draft.reform.extras.includes(e)}
                    onChange={() => dispatch({ type: "toggleExtra", value: e })}
                  />
                ))}
              </div>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
