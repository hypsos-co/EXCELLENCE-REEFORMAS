"use client";

import { OCCUPANCY, PROPERTY_TYPES, type PropertyType } from "@/lib/budget/options";
import { IconBuilding, IconHouse, IconKey, IconStore } from "@/components/icons";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { ChoiceGroup, Chip, IconCard } from "../ui";

const ICONS: Record<PropertyType, React.ReactNode> = {
  piso: <IconBuilding size={24} />,
  casa: <IconHouse size={24} />,
  local: <IconStore size={24} />,
  otro: <IconKey size={24} />,
};

export function StepProperty({ draft, dispatch, errors }: { draft: Draft; dispatch: (a: Action) => void; errors: FieldErrors }) {
  const type = draft.property.type;
  const isHome = !type || type === "piso" || type === "casa";
  const typeErrId = `${fieldId("property.type")}-error`;

  return (
    <div className="space-y-10">
      <ChoiceGroup legend="Tipo de inmueble" errorId={typeErrId} error={errors["property.type"]}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {PROPERTY_TYPES.map((p, i) => (
            <IconCard
              key={p.id}
              id={i === 0 ? fieldId("property.type") : undefined}
              name="property-type"
              value={p.id}
              label={p.label}
              icon={ICONS[p.id]}
              checked={type === p.id}
              onChange={() => dispatch({ type: "setProperty", value: { type: p.id } })}
              describedBy={errors["property.type"] ? typeErrId : undefined}
            />
          ))}
        </div>
      </ChoiceGroup>

      <ChoiceGroup
        legend={isHome ? "¿La vivienda está actualmente habitada?" : "¿El inmueble está actualmente en uso?"}
        description="Nos ayuda a organizar la obra para que sea lo más cómoda posible."
        optional
        errorId={`${fieldId("property.occupancy")}-error`}
      >
        <div className="flex flex-wrap gap-2.5">
          {OCCUPANCY.map((o) => (
            <Chip
              key={o.id}
              type="radio"
              name="occupancy"
              value={o.id}
              label={o.label}
              checked={draft.property.occupancy === o.id}
              onChange={() => dispatch({ type: "setProperty", value: { occupancy: o.id } })}
            />
          ))}
        </div>
      </ChoiceGroup>
    </div>
  );
}
