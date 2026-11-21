"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { DETAIL_QUESTIONS, reformLabel, type ReformType } from "@/lib/budget/options";
import { MAX_TEXT, selectedServices } from "@/lib/budget/schema";
import { IconRuler } from "@/components/icons";
import { REFORM_MEDIA } from "../media";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { ChoiceGroup, Chip, Note, TextArea, TextField } from "../ui";

export function StepDetails({ draft, dispatch, errors }: { draft: Draft; dispatch: (a: Action) => void; errors: FieldErrors }) {
  const services = selectedServices(draft.reform);
  const multi = services.length > 1;
  const asksSize = services.some((s) => DETAIL_QUESTIONS[s].size);

  return (
    <div className="space-y-10">
      {asksSize && (
        <Note icon={<IconRuler size={20} />}>
          <strong className="font-bold">No necesitas conocer las medidas exactas.</strong> Una aproximación es suficiente; si no lo
          sabes, elige «No lo sé».
        </Note>
      )}
      {services.map((s) => (
        <ServiceDetails key={s} service={s} draft={draft} dispatch={dispatch} errors={errors} showHeader={multi} />
      ))}
    </div>
  );
}

function ServiceDetails({
  service,
  draft,
  dispatch,
  errors,
  showHeader,
}: {
  service: ReformType;
  draft: Draft;
  dispatch: (a: Action) => void;
  errors: FieldErrors;
  showHeader: boolean;
}) {
  const q = DETAIL_QUESTIONS[service];
  const a = draft.details[service] ?? { items: [] };
  const base = `details.${service}`;
  const otherSelected = !!q.items?.other && a.items.includes(q.items.other);

  return (
    <section aria-labelledby={showHeader ? `h-${service}` : undefined} className="space-y-8">
      {showHeader && (
        <div className="flex items-center gap-3 border-b border-navy/10 pb-3">
          <span className="relative size-11 overflow-hidden rounded-xl">
            <Image src={REFORM_MEDIA[service].src} alt="" fill sizes="44px" className="object-cover" />
          </span>
          <h2 id={`h-${service}`} className="font-display-tight text-2xl text-navy uppercase">
            {reformLabel(service)}
          </h2>
        </div>
      )}

      {q.size && (
        <ChoiceGroup legend={q.size.label} optional errorId={`${fieldId(`${base}.size`)}-error`} error={errors[`${base}.size`]}>
          <div className="flex flex-wrap gap-2.5">
            {q.size.options.map((o, i) => (
              <Chip
                key={o.id}
                id={i === 0 ? fieldId(`${base}.size`) : undefined}
                type="radio"
                name={`${service}-size`}
                value={o.id}
                label={o.label}
                checked={a.size === o.id}
                onChange={() => dispatch({ type: "setSize", service, value: o.id })}
              />
            ))}
          </div>
        </ChoiceGroup>
      )}

      {q.items && (
        <ChoiceGroup
          legend={q.items.label}
          description="Puedes marcar varias opciones."
          optional
          errorId={`${fieldId(`${base}.items`)}-error`}
          error={errors[`${base}.items`]}
        >
          <div className="flex flex-wrap gap-2.5">
            {q.items.options.map((o, i) => (
              <Chip
                key={o.id}
                id={i === 0 ? fieldId(`${base}.items`) : undefined}
                type="checkbox"
                name={`${service}-items`}
                value={o.id}
                label={o.label}
                checked={a.items.includes(o.id)}
                onChange={() => dispatch({ type: "toggleItem", service, value: o.id })}
              />
            ))}
          </div>
          <AnimatePresence initial={false}>
            {otherSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <TextField
                  id={fieldId(`${base}.other`)}
                  className="pt-4"
                  label="¿Qué otros cambios tienes en mente?"
                  optional
                  maxLength={300}
                  value={a.other ?? ""}
                  onChange={(e) => dispatch({ type: "setDetailText", service, field: "other", value: e.target.value })}
                  placeholder="Por ejemplo: cambiar la puerta, añadir un radiador toallero…"
                  error={errors[`${base}.other`]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ChoiceGroup>
      )}

      {q.description && (
        <TextArea
          id={fieldId(`${base}.description`)}
          label={q.description.label}
          hint="Describe con tus palabras qué quieres hacer. No hace falta usar términos técnicos."
          maxLength={MAX_TEXT}
          rows={6}
          value={a.description ?? ""}
          placeholder={q.description.placeholder}
          onChange={(e) => dispatch({ type: "setDetailText", service, field: "description", value: e.target.value })}
          error={errors[`${base}.description`]}
        />
      )}
    </section>
  );
}
