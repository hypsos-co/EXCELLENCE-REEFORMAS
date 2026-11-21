"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { selectedServices } from "@/lib/budget/schema";
import { budgetText, detailRows, locationText, propertyText, reformTitle, timingText } from "@/lib/budget/summary";
import { serviceZone } from "@/lib/budget/zone";
import { IconAlert, IconEdit, IconImage } from "@/components/icons";
import { REFORM_MEDIA } from "../media";
import type { PhotoItem } from "../photos";
import { STEPS, type Draft, type StepId } from "../state";

export type SubmitError = { message: string; fieldErrors?: Record<string, string>; steps?: StepId[] };

export function StepSummary({
  draft,
  photos,
  onEdit,
  error,
}: {
  draft: Draft;
  photos: PhotoItem[];
  onEdit: (step: StepId) => void;
  error?: SubmitError | null;
}) {
  const services = selectedServices(draft.reform);
  const readyPhotos = photos.filter((p) => p.status === "ready");
  const outside = serviceZone(draft.location) === "fuera";

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/5 p-4 text-[15px] text-navy sm:p-5">
          <p className="flex items-start gap-2 font-bold text-danger">
            <IconAlert size={20} className="mt-0.5 shrink-0" />
            {error.message}
          </p>
          {error.steps && error.steps.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {error.steps.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-navy ring-1 ring-navy/20 hover:ring-navy"
                  >
                    <IconEdit size={15} /> Revisar «{STEPS.find((x) => x.id === s)?.short}»
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Cabecera visual del proyecto */}
      <div className="relative overflow-hidden rounded-3xl bg-navy text-white">
        <div className="absolute inset-0 flex">
          {services.slice(0, 3).map((s) => (
            <div key={s} className="relative flex-1">
              <Image src={REFORM_MEDIA[s].src} alt="" fill sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/80 to-navy-950/40" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-steel-soft uppercase">Tu proyecto</p>
            <p className="font-display-tight mt-1 text-3xl leading-none uppercase sm:text-4xl">{reformTitle(draft)}</p>
            <p className="mt-2 text-[15px] text-white/85">
              {propertyText(draft)} · {draft.location.locality.trim() || "Sin localidad"}
            </p>
          </div>
          <EditButton onClick={() => onEdit("tipo")} label="Editar tipo de reforma" tone="dark" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Características" step="detalles" onEdit={onEdit}>
          <Rows
            rows={[
              { label: "Inmueble", value: propertyText(draft), edit: "inmueble" as StepId },
              ...detailRows(draft).map((r) => ({ ...r, edit: undefined })),
            ]}
            onEdit={onEdit}
          />
        </Card>

        <div className="grid gap-4">
          <Card title="Ubicación" step="ubicacion" onEdit={onEdit}>
            <Rows rows={[{ label: "Localidad", value: locationText(draft) }]} onEdit={onEdit} />
            {outside && draft.location.locality.trim() && (
              <p className="mt-3 text-sm text-steel-ink">Fuera de la zona habitual: la valoraremos igualmente.</p>
            )}
          </Card>
          <Card title="Plazos y presupuesto" step="plazos" onEdit={onEdit}>
            <Rows
              rows={[
                { label: "Fecha prevista", value: timingText(draft) },
                { label: "Presupuesto orientativo", value: budgetText(draft) },
              ]}
              onEdit={onEdit}
            />
          </Card>
        </div>

        <Card title="Descripción y fotografías" step="fotos" onEdit={onEdit}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-navy">
            {draft.description.trim() || <span className="text-steel-ink">Sin descripción adicional.</span>}
          </p>
          {readyPhotos.length > 0 ? (
            <ul className="mt-4 grid grid-cols-4 gap-2" aria-label={`${readyPhotos.length} fotografías adjuntas`}>
              {readyPhotos.map((p, i) => (
                <li key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-mist">
                  {p.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                    <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-steel-ink">
                      <IconImage size={20} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-steel-ink">Sin fotografías adjuntas.</p>
          )}
        </Card>

        <Card title="Datos de contacto" step="contacto" onEdit={onEdit}>
          <Rows
            rows={[
              { label: "Nombre", value: draft.contact.name },
              { label: "Teléfono", value: draft.contact.phone },
              { label: "Email", value: draft.contact.email },
            ]}
            onEdit={onEdit}
          />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, step, onEdit, children }: { title: string; step: StepId; onEdit: (s: StepId) => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy/8 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold tracking-[0.16em] text-steel-ink uppercase">{title}</h2>
        <EditButton onClick={() => onEdit(step)} label={`Editar ${title.toLowerCase()}`} />
      </div>
      {children}
    </section>
  );
}

function Rows({
  rows,
  onEdit,
}: {
  rows: { label: string; value: string; edit?: StepId }[];
  onEdit: (s: StepId) => void;
}) {
  return (
    <dl className="divide-y divide-navy/8">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2.5 first:pt-0 last:pb-0">
          <dt className="text-sm text-steel-ink">{r.label}</dt>
          <dd className="text-[15px] font-semibold break-words text-navy">
            {r.value}
            {r.edit && (
              <button type="button" onClick={() => onEdit(r.edit!)} className="ml-2 text-sm font-semibold text-steel-ink underline underline-offset-4 hover:text-navy">
                Cambiar
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EditButton({ onClick, label, tone = "light" }: { onClick: () => void; label: string; tone?: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        tone === "dark"
          ? "inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
          : "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-navy ring-1 ring-navy/15 transition hover:ring-navy"
      }
    >
      <IconEdit size={15} />
      Editar
    </button>
  );
}
