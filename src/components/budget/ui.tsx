"use client";

import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { IconAlert, IconCheck, IconPlus } from "@/components/icons";
import { cx } from "@/lib/cx";


/* ------------------------------ Mensajes -------------------------------- */

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
      <IconAlert size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Optional() {
  return <span className="ml-2 align-middle text-xs font-semibold tracking-wide text-steel-ink uppercase">Opcional</span>;
}

/* ------------------------------ Grupos ---------------------------------- */

export function ChoiceGroup({
  legend,
  description,
  optional,
  error,
  errorId,
  children,
  className,
}: {
  legend: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  error?: string;
  errorId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cx("min-w-0", className)} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1 text-lg font-bold text-navy sm:text-xl">
        {legend}
        {optional && <Optional />}
      </legend>
      {description && <p className="mb-4 text-[15px] text-steel-ink">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

/* --------------------------- Tarjeta con foto --------------------------- */

export function OptionCard({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  hint,
  image,
  alt,
  describedBy,
  sizes,
}: {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  image: StaticImageData;
  alt: string;
  describedBy?: string;
  sizes: string;
}) {
  return (
    <label className="group relative block cursor-pointer select-none overflow-hidden rounded-2xl bg-mist shadow-card transition-shadow duration-300 hover:shadow-lift">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <div className="relative aspect-[5/4] sm:aspect-[4/5]">
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          placeholder="blur"
          className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3.5 text-white sm:p-5">
        <span className="block text-base leading-tight font-bold sm:text-xl">{label}</span>
        {hint && <span className="mt-1 hidden text-sm text-white/80 sm:block">{hint}</span>}
      </div>
      <span className="absolute top-3 right-3 grid size-8 scale-75 place-items-center rounded-full bg-white text-navy opacity-0 shadow-card transition duration-200 peer-checked:scale-100 peer-checked:opacity-100">
        <IconCheck size={18} strokeWidth={2.5} />
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-navy/10 ring-inset transition peer-checked:ring-4 peer-checked:ring-navy peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-steel" />
    </label>
  );
}

/* ---------------------------- Tarjeta icono ----------------------------- */

export function IconCard({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  icon,
  describedBy,
}: {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: ReactNode;
  describedBy?: string;
}) {
  return (
    <label className="group relative block cursor-pointer select-none">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span className="flex min-h-24 flex-col items-start justify-between gap-4 rounded-2xl border border-navy/12 bg-white p-4 text-navy shadow-card transition duration-200 group-hover:border-navy/30 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-steel sm:min-h-32 sm:p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-mist text-navy transition group-has-checked:bg-white/12 group-has-checked:text-white">
          {icon}
        </span>
        <span className="text-[15px] leading-snug font-bold sm:text-base">{label}</span>
      </span>
      <span className="absolute top-3 right-3 grid size-6 scale-75 place-items-center rounded-full bg-white text-navy opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100">
        <IconCheck size={14} strokeWidth={2.75} />
      </span>
    </label>
  );
}

/* -------------------------------- Chips --------------------------------- */

export function Chip({
  id,
  type,
  name,
  value,
  checked,
  onChange,
  label,
  describedBy,
  onClick,
}: {
  id?: string;
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  describedBy?: string;
  onClick?: () => void;
}) {
  return (
    <label className="relative inline-flex cursor-pointer select-none">
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/15 bg-white px-4.5 py-2.5 text-[15px] leading-tight font-semibold text-navy transition duration-200 hover:border-navy/40 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-steel">
        {type === "checkbox" &&
          (checked ? <IconCheck size={16} strokeWidth={2.5} /> : <IconPlus size={16} strokeWidth={2.25} className="text-steel" />)}
        {label}
      </span>
    </label>
  );
}

/* ------------------------------- Campos --------------------------------- */

const inputBase =
  "block w-full rounded-xl border bg-white px-4 text-base text-navy placeholder:text-steel-ink/70 shadow-[inset_0_1px_2px_rgb(16_43_73/0.04)] transition focus:border-navy focus:ring-4 focus:ring-steel/25 focus:outline-none";

export function TextField({
  id,
  label,
  optional,
  hint,
  error,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold text-navy">
        {label}
        {optional && <Optional />}
      </label>
      {hint && (
        <p id={hintId} className="mb-2 text-sm text-steel-ink">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(hint && hintId, error && errId) || undefined}
        className={cx(inputBase, "h-13", error ? "border-danger" : "border-navy/15")}
        {...input}
      />
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  options,
  className,
  ...select
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  error?: string;
  options: readonly string[];
}) {
  const errId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold text-navy">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className={cx(inputBase, "h-13 appearance-none pr-11", error ? "border-danger" : "border-navy/15")}
          {...select}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-steel-ink" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}

export function TextArea({
  id,
  label,
  optional,
  hint,
  error,
  maxLength,
  value,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  maxLength: number;
  value: string;
}) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const near = value.length > maxLength * 0.85;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold text-navy">
        {label}
        {optional && <Optional />}
      </label>
      {hint && (
        <p id={hintId} className="mb-2 text-sm text-steel-ink">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(hint && hintId, error && errId) || undefined}
        className={cx(inputBase, "min-h-36 resize-y py-3 leading-relaxed", error ? "border-danger" : "border-navy/15")}
        {...rest}
      />
      <div className="mt-1.5 flex justify-end">
        <span className={cx("text-xs tabular-nums", near ? "font-semibold text-navy" : "text-steel-ink")} aria-live={near ? "polite" : "off"}>
          {value.length}/{maxLength}
        </span>
      </div>
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}

export function Note({ icon, children, tone = "info" }: { icon?: ReactNode; children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed",
        tone === "info" ? "bg-mist-50 text-navy ring-1 ring-navy/8" : "bg-[#FFF7E8] text-[#5C3B00] ring-1 ring-[#E8C98A]",
      )}
    >
      {icon && <span className="mt-0.5 shrink-0 text-steel-ink">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
