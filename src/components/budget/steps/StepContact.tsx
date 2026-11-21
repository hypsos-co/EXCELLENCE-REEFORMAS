"use client";

import Link from "next/link";
import { IconCheck, IconShield } from "@/components/icons";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { FieldError, TextField } from "../ui";
import { cx } from "@/lib/cx";

export function StepContact({
  draft,
  dispatch,
  errors,
  onBlurField,
  honeypot,
  setHoneypot,
}: {
  draft: Draft;
  dispatch: (a: Action) => void;
  errors: FieldErrors;
  onBlurField: (path: string) => void;
  honeypot: string;
  setHoneypot: (v: string) => void;
}) {
  const { name, phone, email } = draft.contact;
  const consentId = fieldId("consent.privacy");
  const consentErr = errors["consent.privacy"];

  return (
    <div className="space-y-6">
      <TextField
        id={fieldId("contact.name")}
        label="Nombre y apellidos"
        autoComplete="name"
        autoCapitalize="words"
        maxLength={100}
        value={name}
        onChange={(e) => dispatch({ type: "setContact", value: { name: e.target.value } })}
        onBlur={() => onBlurField("contact.name")}
        error={errors["contact.name"]}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id={fieldId("contact.phone")}
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          value={phone}
          placeholder="600 123 456"
          onChange={(e) => dispatch({ type: "setContact", value: { phone: e.target.value } })}
          onBlur={() => onBlurField("contact.phone")}
          error={errors["contact.phone"]}
        />
        <TextField
          id={fieldId("contact.email")}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={email}
          placeholder="nombre@correo.com"
          onChange={(e) => dispatch({ type: "setContact", value: { email: e.target.value } })}
          onBlur={() => onBlurField("contact.email")}
          error={errors["contact.email"]}
        />
      </div>

      {/* Campo trampa para bots: invisible y fuera del orden de tabulación. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">No rellenes este campo</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div>
        <label
          htmlFor={consentId}
          className={cx(
            "group flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition",
            consentErr ? "border-danger bg-danger/4" : "border-navy/12 bg-mist-50 hover:border-navy/30",
          )}
        >
          <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
            <input
              id={consentId}
              type="checkbox"
              checked={draft.consent}
              onChange={(e) => dispatch({ type: "setConsent", value: e.target.checked })}
              aria-invalid={consentErr ? true : undefined}
              aria-describedby={consentErr ? `${consentId}-error` : "consent-info"}
              className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-navy/35 bg-white transition checked:border-navy checked:bg-navy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-steel"
            />
            <IconCheck size={16} strokeWidth={3} className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100" />
          </span>
          <span className="text-[15px] leading-relaxed text-navy">
            He leído y acepto la{" "}
            <Link
              href="/politica-de-privacidad"
              target="_blank"
              rel="noopener"
              className="font-bold underline decoration-steel underline-offset-4 hover:decoration-navy"
            >
              política de privacidad
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </Link>
            .
          </span>
        </label>
        <FieldError id={`${consentId}-error`}>{consentErr}</FieldError>
      </div>

      <p id="consent-info" className="flex items-start gap-2 text-sm leading-relaxed text-steel-ink">
        <IconShield size={18} className="mt-0.5 shrink-0" />
        <span>Usaremos tus datos únicamente para estudiar tu solicitud y ponernos en contacto contigo. No los cedemos a terceros.</span>
      </p>
    </div>
  );
}
