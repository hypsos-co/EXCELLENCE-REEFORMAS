"use client";

import { BUDGET_RANGES, TIMINGS } from "@/lib/budget/options";
import { IconInfo } from "@/components/icons";
import { fieldId, type Action, type Draft } from "../state";
import { ChoiceGroup, Chip } from "../ui";

export function StepPlanning({ draft, dispatch }: { draft: Draft; dispatch: (a: Action) => void }) {
  const { timing, budget } = draft.planning;
  return (
    <div className="space-y-10">
      <ChoiceGroup legend="¿Tienes alguna fecha prevista para empezar?" optional errorId={`${fieldId("planning.timing")}-error`}>
        <div className="flex flex-wrap gap-2.5">
          {TIMINGS.map((t) => (
            <Chip
              key={t.id}
              type="radio"
              name="timing"
              value={t.id}
              label={t.label}
              checked={timing === t.id}
              onChange={() => dispatch({ type: "setPlanning", value: { timing: t.id } })}
            />
          ))}
        </div>
        {timing && <ClearButton onClick={() => dispatch({ type: "setPlanning", value: { timing: undefined } })} />}
      </ChoiceGroup>

      <ChoiceGroup
        legend="¿Tienes un presupuesto aproximado en mente?"
        description="Puedes omitir esta pregunta. Nos ayuda a proponerte soluciones acordes a tus expectativas."
        optional
        errorId={`${fieldId("planning.budget")}-error`}
      >
        <div className="flex flex-wrap gap-2.5">
          {BUDGET_RANGES.map((b) => (
            <Chip
              key={b.id}
              type="radio"
              name="budget"
              value={b.id}
              label={b.label}
              checked={budget === b.id}
              onChange={() => dispatch({ type: "setPlanning", value: { budget: b.id } })}
            />
          ))}
        </div>
        {budget && <ClearButton onClick={() => dispatch({ type: "setPlanning", value: { budget: undefined } })} />}
        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-steel-ink">
          <IconInfo size={18} className="mt-0.5 shrink-0" />
          <span>
            Son rangos orientativos para conocer tus expectativas. No son precios de Excellence Reformas ni generan un presupuesto
            automático: cada proyecto se estudia de forma personalizada.
          </span>
        </p>
      </ChoiceGroup>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-steel-ink underline decoration-steel/50 underline-offset-4 hover:text-navy"
    >
      Quitar selección
    </button>
  );
}
