"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MAX_TEXT } from "@/lib/budget/schema";
import { UPLOAD_LIMITS, formatBytes } from "@/lib/budget/uploads";
import { IconAlert, IconCamera, IconImage, IconShield, IconTrash } from "@/components/icons";
import type { PhotoItem } from "../photos";
import { fieldId, type Action, type Draft, type FieldErrors } from "../state";
import { FieldError, Optional, TextArea } from "../ui";
import { cx } from "@/lib/cx";

export function StepPhotos({
  draft,
  dispatch,
  errors,
  photos,
  onAddFiles,
  onRemovePhoto,
  photoNotice,
}: {
  draft: Draft;
  dispatch: (a: Action) => void;
  errors: FieldErrors;
  photos: PhotoItem[];
  onAddFiles: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  photoNotice?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= UPLOAD_LIMITS.maxFiles;
  const totalBytes = photos.reduce((n, p) => n + (p.size ?? 0), 0);

  return (
    <div className="space-y-10">
      <TextArea
        id={fieldId("description")}
        label="Cuéntanos tu idea"
        optional
        hint="¿Qué te gustaría conseguir? Estilo, materiales, colores, problemas que quieres resolver…"
        maxLength={MAX_TEXT}
        rows={5}
        value={draft.description}
        onChange={(e) => dispatch({ type: "setDescription", value: e.target.value })}
        placeholder="Por ejemplo: quiero una cocina abierta al salón, en tonos claros y con más espacio de almacenamiento."
        error={errors["description"]}
      />

      <div>
        <h2 id="photos-label" className="mb-1 text-lg font-bold text-navy sm:text-xl">
          Fotografías
          <Optional />
        </h2>
        <p id="photos-hint" className="mb-4 text-[15px] text-steel-ink">
          Puedes enviarnos fotografías del espacio actual o imágenes de inspiración. Nos ayudarán a entender mejor tu idea.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!full) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!full) onAddFiles(Array.from(e.dataTransfer.files));
          }}
          className={cx(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition sm:py-10",
            dragging ? "border-navy bg-mist" : "border-navy/20 bg-mist-50",
            full && "opacity-60",
          )}
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-navy shadow-card">
            <IconCamera size={28} />
          </span>
          <div>
            <p className="text-base font-bold text-navy">
              <span className="hidden sm:inline">Arrastra tus fotos aquí o selecciónalas</span>
              <span className="sm:hidden">Haz una foto o elige de tu galería</span>
            </p>
            <p className="mt-1 text-sm text-steel-ink">
              Hasta {UPLOAD_LIMITS.maxFiles} fotos · JPG, PNG, WEBP o HEIC · máx. {formatBytes(UPLOAD_LIMITS.maxOriginalBytes)} cada una
            </p>
          </div>
          <button
            type="button"
            id={fieldId("photos")}
            onClick={() => inputRef.current?.click()}
            disabled={full}
            aria-describedby="photos-hint photos-count"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-6 text-[15px] font-bold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-steel"
          >
            <IconImage size={18} />
            {photos.length ? "Añadir más fotos" : "Adjuntar fotografías"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={UPLOAD_LIMITS.acceptAttribute}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) onAddFiles(files);
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-steel-ink">
          <span id="photos-count" aria-live="polite">
            {photos.length} de {UPLOAD_LIMITS.maxFiles} fotos
            {totalBytes > 0 && ` · ${formatBytes(totalBytes)} tras optimizarlas`}
          </span>
        </div>
        {photoNotice && (
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger" role="status">
            <IconAlert size={16} className="mt-0.5 shrink-0" />
            {photoNotice}
          </p>
        )}
        <FieldError id={`${fieldId("photos")}-error`}>{errors["photos"]}</FieldError>

        {photos.length > 0 && (
          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-label="Fotografías adjuntas">
            <AnimatePresence initial={false}>
              {photos.map((p, i) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className={cx(
                    "relative aspect-square overflow-hidden rounded-xl bg-mist ring-1",
                    p.status === "error" ? "ring-danger" : "ring-navy/10",
                  )}
                >
                  {p.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                    <img src={p.previewUrl} alt={`Foto ${i + 1}: ${p.originalName}`} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-steel-ink">
                      {p.status === "error" ? <IconAlert size={22} className="text-danger" /> : <IconImage size={22} />}
                      <span className="line-clamp-2 text-[11px] leading-tight break-all">{p.originalName}</span>
                    </div>
                  )}
                  {p.status === "processing" && (
                    <div className="absolute inset-0 grid place-items-center bg-white/70" role="status" aria-label="Optimizando foto">
                      <span className="size-6 animate-spin rounded-full border-2 border-navy/20 border-t-navy motion-reduce:animate-none" />
                    </div>
                  )}
                  {p.status === "error" && p.error && (
                    <p className="absolute inset-x-0 bottom-0 bg-danger/92 px-1.5 py-1 text-[11px] leading-tight text-white">{p.error}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(p.id)}
                    aria-label={`Eliminar foto ${i + 1} (${p.originalName})`}
                    className="absolute top-1.5 right-1.5 grid size-9 place-items-center rounded-full bg-navy-950/75 text-white backdrop-blur transition hover:bg-navy-950"
                  >
                    <IconTrash size={16} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-steel-ink">
          <IconShield size={18} className="mt-0.5 shrink-0" />
          <span>
            Tus fotos se envían de forma privada solo a Excellence Reformas; no se publican. Las optimizamos en tu dispositivo y eliminamos
            sus metadatos (como la ubicación). Evita que aparezcan personas o documentos.
          </span>
        </p>
      </div>
    </div>
  );
}
