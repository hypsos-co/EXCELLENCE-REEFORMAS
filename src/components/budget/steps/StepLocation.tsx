"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { siteConfig } from "@/config/site";
import { PROVINCES } from "@/lib/budget/options";
import { serviceZone } from "@/lib/budget/zone";
import { IconPin } from "@/components/icons";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { Note, SelectField, TextField } from "../ui";

export function StepLocation({ draft, dispatch, errors }: { draft: Draft; dispatch: (a: Action) => void; errors: FieldErrors }) {
  const [localityTouched, setLocalityTouched] = useState(false);
  const { locality, province, postalCode } = draft.location;
  const outside = locality.trim().length >= 2 && serviceZone({ locality, province }) === "fuera";
  const showOutside = outside && (localityTouched || province !== siteConfig.serviceArea.provinces[0]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id={fieldId("location.locality")}
          className="sm:col-span-2"
          label="Localidad"
          autoComplete="address-level2"
          list="localidades"
          value={locality}
          maxLength={80}
          onChange={(e) => dispatch({ type: "setLocation", value: { locality: e.target.value } })}
          onBlur={() => setLocalityTouched(true)}
          placeholder="Por ejemplo: Madrid, Alcobendas, Pozuelo…"
          error={errors["location.locality"]}
        />
        <datalist id="localidades">
          {siteConfig.serviceArea.localities.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <TextField
          id={fieldId("location.postalCode")}
          label="Código postal"
          optional
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          pattern="[0-9]*"
          value={postalCode}
          onChange={(e) => dispatch({ type: "setLocation", value: { postalCode: e.target.value.replace(/\D/g, "") } })}
          placeholder="28001"
          error={errors["location.postalCode"]}
        />
        <SelectField
          id={fieldId("location.province")}
          label="Provincia"
          autoComplete="address-level1"
          options={PROVINCES}
          value={province}
          onChange={(e) => dispatch({ type: "setLocation", value: { province: e.target.value } })}
          error={errors["location.province"]}
        />
      </div>

      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {showOutside && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <Note icon={<IconPin size={20} />}>
                <strong className="font-bold">{locality.trim()}</strong> está fuera de nuestra zona habitual ({siteConfig.serviceArea.label}),
                pero puedes continuar: {siteConfig.owner} valorará tu solicitud igualmente.
              </Note>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
