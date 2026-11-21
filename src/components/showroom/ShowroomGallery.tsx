"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReformType } from "@/lib/budget/options";
import { cx } from "@/lib/cx";
import { categoryLabel, type ShowroomCategory, type ShowroomPhoto } from "@/content/showroom";
import { IconArrowLeft, IconArrowRight, IconClose, IconExpand, IconSpark } from "@/components/icons";
import { CtaLink, budgetHref } from "@/components/site/CtaLink";

type Filter = "todas" | ShowroomCategory;

/** Tipo de reforma que se preselecciona en el asistente desde cada categoría. */
const BUDGET_TYPE: Record<ShowroomCategory, ReformType> = {
  salones: "integral",
  cocinas: "cocina",
  banos: "bano",
  dormitorios: "otra",
  pasillos: "integral",
  decoracion: "pintura",
  trabajo: "otra",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function ShowroomGallery({
  photos,
  categories,
}: {
  photos: ShowroomPhoto[];
  categories: readonly { id: ShowroomCategory; label: string; short: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [open, setOpen] = useState<number | null>(null);

  const visible = useMemo(() => (filter === "todas" ? photos : photos.filter((p) => p.category === filter)), [filter, photos]);
  const counts = useMemo(() => {
    const c = new Map<ShowroomCategory, number>();
    photos.forEach((p) => c.set(p.category, (c.get(p.category) ?? 0) + 1));
    return c;
  }, [photos]);

  const filters: { id: Filter; label: string; title?: string; count: number }[] = [
    { id: "todas", label: "Todas", count: photos.length },
    ...categories.map((c) => ({ id: c.id, label: c.short, title: c.label, count: counts.get(c.id) ?? 0 })),
  ];

  const ctaAfter = visible.length > 10 ? 7 : -1;

  return (
    <MotionConfig reducedMotion="user">
      <div className="sticky top-18 z-30 -mx-5 border-y border-navy/8 bg-white/92 px-5 backdrop-blur-md sm:-mx-8 sm:px-8 lg:top-20">
        <div role="group" aria-label="Filtrar por tipo de espacio" className="no-scrollbar flex gap-2 overflow-x-auto py-3 [mask-image:linear-gradient(to_right,black_88%,transparent)] lg:[mask-image:none]">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                title={f.title}
                onClick={() => setFilter(f.id)}
                className={cx(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition",
                  active ? "bg-navy text-white" : "bg-mist-50 text-navy ring-1 ring-navy/10 hover:ring-navy/40",
                )}
              >
                {f.label}
                <span className={cx("text-xs tabular-nums", active ? "text-white/70" : "text-steel-ink")}>{f.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} fotografías{filter !== "todas" ? ` de ${categoryLabel(filter)}` : ""}
      </p>

      <motion.ul
        key={filter}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
        className="mt-8 columns-2 gap-3 sm:gap-5 lg:columns-3 xl:columns-4"
        aria-label="Fotografías del showroom"
      >
        {visible.map((p, i) => (
          <GalleryItem key={p.id} photo={p} onOpen={() => setOpen(i)} showCta={i === ctaAfter} />
        ))}
      </motion.ul>

      <Lightbox photos={visible} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </MotionConfig>
  );
}

function GalleryItem({ photo: p, onOpen, showCta }: { photo: ShowroomPhoto; onOpen: () => void; showCta: boolean }) {
  return (
    <>
      <li className="mb-3 break-inside-avoid sm:mb-5">
        <button type="button" onClick={onOpen} aria-label={`Ver en grande: ${p.title}`} className="group block w-full rounded-2xl text-left">
          <span className="relative block overflow-hidden rounded-2xl bg-mist shadow-card transition-shadow duration-300 group-hover:shadow-lift">
            <Image
              src={p.src}
              alt={`${p.title}. ${p.description}`}
              placeholder="blur"
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 31vw, 47vw"
              className="h-auto w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute right-3 bottom-3 grid size-10 translate-y-1 place-items-center rounded-full bg-white/95 text-navy opacity-0 shadow-card transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              <IconExpand size={18} />
            </span>
          </span>
          <span className="block px-1 pt-3">
            <span className="block text-[15px] leading-snug font-bold text-navy">{p.title}</span>
            <span className="mt-1 block text-[11px] font-bold tracking-[0.14em] text-steel-ink uppercase">{categoryLabel(p.category)}</span>
          </span>
        </button>
      </li>
      {showCta && (
        <li className="mb-3 break-inside-avoid sm:mb-5">
          <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
            <IconSpark size={26} className="text-steel-soft" />
            <p className="font-display-tight mt-4 text-3xl leading-[0.95] uppercase">Tu casa puede ser la próxima</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/80">Cuéntanos tu proyecto en unos 2 minutos.</p>
            <CtaLink variant="light" size="sm" className="mt-5">
              Empezar mi Glow Up
            </CtaLink>
          </div>
        </li>
      )}
    </>
  );
}

/* ------------------------------- Visor ---------------------------------- */

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: ShowroomPhoto[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [direction, setDirection] = useState(1);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const isOpen = index !== null;
  const total = photos.length;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [isOpen]);

  const go = useCallback(
    (delta: number) => {
      if (index === null || total === 0) return;
      setDirection(delta);
      onIndex((index + delta + total) % total);
    },
    [index, onIndex, total],
  );

  const photo = index !== null ? photos[index] : null;
  const neighbors = index !== null && total > 1 ? [photos[(index + 1) % total], photos[(index - 1 + total) % total]] : [];

  return (
    <dialog
      ref={dialogRef}
      aria-label={photo ? `${photo.title}, foto ${index! + 1} de ${total}` : "Visor de fotografías"}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-navy-950 p-0 text-white backdrop:bg-navy-950/90"
    >
      {photo && (
        <div className="flex h-full flex-col">
          {/* Barra superior */}
          <div className="flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-6">
            <p className="text-sm text-white/75 tabular-nums">
              <span className="font-bold text-white">{index! + 1}</span> / {total}
              <span className="mx-2 text-white/30">·</span>
              {categoryLabel(photo.category)}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar visor"
              className="grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
            >
              <IconClose size={22} />
            </button>
          </div>

          {/* Imagen */}
          <div
            className="relative min-h-0 flex-1 touch-pan-y select-none"
            onPointerDown={(e) => {
              pointerStart.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = pointerStart.current;
              pointerStart.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              const dy = e.clientY - s.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
            }}
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={photo.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } }}
                exit={{ opacity: 0, x: direction * -60, transition: { duration: 0.2 } }}
                className="pointer-events-none absolute inset-x-3 inset-y-1 sm:inset-x-20"
              >
                <Image
                  src={photo.src}
                  alt={`${photo.title}. ${photo.description}`}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  className="object-contain"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {total > 1 && (
              <>
                <NavButton side="left" onClick={() => go(-1)} />
                <NavButton side="right" onClick={() => go(1)} />
              </>
            )}

            {/* Precarga de las fotos vecinas */}
            <div aria-hidden="true" className="pointer-events-none absolute size-px overflow-hidden opacity-0">
              {neighbors.map((n) => (
                <Image key={n.id} src={n.src} alt="" width={4} height={6} sizes="100vw" loading="eager" />
              ))}
            </div>
          </div>

          {/* Pie */}
          <div className="flex flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
            <div className="max-w-2xl">
              <h2 className="text-lg leading-snug font-bold sm:text-xl">{photo.title}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-white/75">{photo.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {total > 1 && (
                <div className="flex gap-2 sm:hidden">
                  <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="grid size-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <IconArrowLeft size={20} />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="grid size-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <IconArrowRight size={20} />
                  </button>
                </div>
              )}
              <Link
                href={budgetHref(BUDGET_TYPE[photo.category])}
                className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-extrabold text-navy transition hover:bg-mist"
              >
                Quiero algo así
                <IconArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? IconArrowLeft : IconArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      className={cx(
        "absolute top-1/2 hidden size-13 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25 sm:grid",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon size={22} />
    </button>
  );
}
