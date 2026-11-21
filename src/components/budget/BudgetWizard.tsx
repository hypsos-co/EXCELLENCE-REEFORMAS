"use client";

import Image from "next/image";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { hasWhatsApp, siteConfig } from "@/config/site";
import type { ReformType } from "@/lib/budget/options";
import { reformTitle } from "@/lib/budget/summary";
import { UPLOAD_LIMITS } from "@/lib/budget/uploads";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import { Logo } from "@/components/brand/Logo";
import { IconArrowLeft, IconArrowRight, IconCheck, IconClock, IconClose, IconSpark } from "@/components/icons";
import { DEFAULT_MEDIA, REFORM_MEDIA } from "./media";
import { preparePhoto, type PhotoItem } from "./photos";
import {
  STEPS,
  STEP_MESSAGES,
  SUMMARY_INDEX,
  TOTAL_STEPS,
  fieldId,
  initialDraft,
  newIdempotencyKey,
  reducer,
  stepForField,
  toPayload,
  validateStep,
  type Action,
  type Draft,
  type FieldErrors,
  type StepId,
} from "./state";
import { StepContact } from "./steps/StepContact";
import { StepDetails } from "./steps/StepDetails";
import { StepLocation } from "./steps/StepLocation";
import { StepPhotos } from "./steps/StepPhotos";
import { StepPlanning } from "./steps/StepPlanning";
import { StepProperty } from "./steps/StepProperty";
import { StepSummary, type SubmitError } from "./steps/StepSummary";
import { StepType } from "./steps/StepType";
import { SuccessScreen } from "./SuccessScreen";
import { cx } from "@/lib/cx";

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "error"; error: SubmitError }
  | { status: "success"; reference: string };

const EASE = [0.22, 1, 0.36, 1] as const;

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }),
};

function stepIdAt(index: number): StepId {
  return index >= SUMMARY_INDEX ? "resumen" : STEPS[index].id;
}

function stepCopy(step: StepId, draft: Draft): { title: string; subtitle: string } {
  switch (step) {
    case "tipo":
      return {
        title: "¿Qué espacio quieres transformar?",
        subtitle: "Elige el tipo de reforma. Si tu proyecto incluye varios trabajos, podrás añadirlos a continuación.",
      };
    case "inmueble":
      return { title: "¿Dónde vamos a realizar la reforma?", subtitle: "Cuéntanos qué tipo de inmueble es." };
    case "detalles":
      return draft.reform.primary === "otra"
        ? { title: "Explícanos tu proyecto", subtitle: "Cuéntanos con tus palabras qué te gustaría hacer." }
        : {
            title: "Cuéntanos algunos detalles",
            subtitle: `Las preguntas se adaptan a tu proyecto de ${reformTitle(draft).toLowerCase()}. Responde solo lo que sepas.`,
          };
    case "ubicacion":
      return { title: "¿Dónde se encuentra tu proyecto?", subtitle: "Indícanos la localidad y la provincia. El código postal es opcional." };
    case "plazos":
      return { title: "Plazos y presupuesto", subtitle: "Las dos preguntas son opcionales, pero nos ayudan a planificar contigo." };
    case "fotos":
      return {
        title: "Enséñanos qué tienes en mente.",
        subtitle: "Una breve descripción y algunas fotos nos ayudan muchísimo a entender tu idea.",
      };
    case "contacto":
      return {
        title: "Ya casi estamos. ¿Cómo podemos contactar contigo?",
        subtitle: "Solo te pedimos lo imprescindible para poder responderte.",
      };
    case "resumen":
      return {
        title: "Este es el proyecto que queremos ayudarte a transformar.",
        subtitle: "Revisa que todo esté correcto. Puedes editar cualquier respuesta antes de enviarla.",
      };
  }
}

export function BudgetWizard({ initialType }: { initialType?: ReformType }) {
  const [draft, dispatchDraft] = useReducer(reducer, initialType, initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [furthest, setFurthest] = useState(0);
  const [attempted, setAttempted] = useState<ReadonlySet<StepId>>(new Set());
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [returnToSummary, setReturnToSummary] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoNotice, setPhotoNotice] = useState<string>();
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);

  const startedAt = useRef<number | null>(null);
  const idempotency = useRef<{ key: string; draft: Draft; photos: PhotoItem[] } | null>(null);
  const photosRef = useRef<PhotoItem[]>([]);
  const scrollRef = useRef<HTMLElement>(null);

  const step = stepIdAt(stepIndex);
  const copy = stepCopy(step, draft);
  const isSummary = step === "resumen";

  const dispatch = useCallback((a: Action) => {
    startedAt.current ??= Date.now();
    dispatchDraft(a);
  }, []);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Libera las vistas previas al salir.
  useEffect(() => () => photosRef.current.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl)), []);

  // Aviso al cerrar la pestaña con una solicitud a medias (nada se guarda en el navegador).
  const hasProgress = !!draft.reform.primary || photos.length > 0;
  useEffect(() => {
    if (!hasProgress || submit.status === "success") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasProgress, submit.status]);

  /* ------------------------------ Errores ------------------------------ */

  const allErrors = useMemo(() => validateStep(step, draft), [step, draft]);
  const visibleErrors: FieldErrors = useMemo(() => {
    if (attempted.has(step)) return allErrors;
    return Object.fromEntries(Object.entries(allErrors).filter(([k]) => touched.has(k)));
  }, [allErrors, attempted, step, touched]);

  const markTouched = useCallback((path: string) => setTouched((t) => (t.has(path) ? t : new Set(t).add(path))), []);

  const focusField = (key: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId(key)) as HTMLElement | null;
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  /* ---------------------------- Navegación ----------------------------- */

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setStepIndex(index);
    setFurthest((f) => Math.max(f, index));
    setAnnouncement("");
    setHasNavigated(true);
  };

  const photosBusy = photos.some((p) => p.status === "processing");

  const next = () => {
    if (step === "fotos" && photosBusy) {
      setAnnouncement("Espera un momento: estamos optimizando tus fotos.");
      return;
    }
    const errs = validateStep(step, draft);
    const keys = Object.keys(errs);
    if (keys.length) {
      setAttempted((s) => new Set(s).add(step));
      setAnnouncement("Revisa los campos marcados para continuar.");
      focusField(keys[0]);
      return;
    }
    if (returnToSummary) {
      setReturnToSummary(false);
      goTo(SUMMARY_INDEX, 1);
    } else {
      goTo(stepIndex + 1, 1);
    }
  };

  const back = () => {
    if (stepIndex === 0) return;
    goTo(stepIndex - 1, -1);
  };

  const edit = (target: StepId) => {
    const index = STEPS.findIndex((s) => s.id === target);
    if (index < 0) return;
    setReturnToSummary(true);
    goTo(index, -1);
  };

  const jump = (index: number) => {
    if (index === stepIndex || index > furthest) return;
    goTo(index, index < stepIndex ? -1 : 1);
  };

  /* ------------------------------ Fotos -------------------------------- */

  const addFiles = (files: File[]) => {
    startedAt.current ??= Date.now();
    setPhotoNotice(undefined);
    const available = UPLOAD_LIMITS.maxFiles - photosRef.current.length;
    if (available <= 0) {
      setPhotoNotice(`Ya has adjuntado el máximo de ${UPLOAD_LIMITS.maxFiles} fotos.`);
      return;
    }
    const accepted = files.slice(0, available);
    if (files.length > available) {
      setPhotoNotice(`Solo se pueden adjuntar ${UPLOAD_LIMITS.maxFiles} fotos. Hemos añadido las ${available} primeras.`);
    }
    const items: PhotoItem[] = accepted.map((f) => ({
      id: newIdempotencyKey(),
      originalName: f.name || "foto",
      status: "processing",
    }));
    setPhotos((prev) => [...prev, ...items]);

    accepted.forEach(async (file, i) => {
      const id = items[i].id;
      const result = await preparePhoto(file);
      setPhotos((prev) => {
        if (!prev.some((p) => p.id === id)) {
          if ("previewUrl" in result && result.previewUrl) URL.revokeObjectURL(result.previewUrl);
          return prev;
        }
        if ("error" in result) {
          return prev.map((p) => (p.id === id ? { ...p, status: "error", error: result.error } : p));
        }
        const used = prev.reduce((n, p) => n + (p.status === "ready" ? (p.size ?? 0) : 0), 0);
        if (used + result.file.size > UPLOAD_LIMITS.maxTotalBytes) {
          if (result.previewUrl) URL.revokeObjectURL(result.previewUrl);
          return prev.map((p) =>
            p.id === id ? { ...p, status: "error", error: "Se ha alcanzado el tamaño máximo total. Elimina alguna foto." } : p,
          );
        }
        return prev.map((p) =>
          p.id === id ? { ...p, status: "ready", file: result.file, previewUrl: result.previewUrl, size: result.file.size } : p,
        );
      });
    });
  };

  const removePhoto = (id: string) => {
    setPhotoNotice(undefined);
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  /* ------------------------------- Envío ------------------------------- */

  const send = async () => {
    if (submit.status === "sending") return;
    // Validación completa antes de enviar.
    for (const s of STEPS) {
      const errs = validateStep(s.id, draft);
      const keys = Object.keys(errs);
      if (keys.length) {
        setAttempted((a) => new Set(a).add(s.id));
        goTo(STEPS.findIndex((x) => x.id === s.id), -1);
        setReturnToSummary(true);
        focusField(keys[0]);
        return;
      }
    }
    if (photosBusy) {
      setAnnouncement("Espera un momento: estamos optimizando tus fotos.");
      return;
    }

    if (!idempotency.current || idempotency.current.draft !== draft || idempotency.current.photos !== photos) {
      idempotency.current = { key: newIdempotencyKey(), draft, photos };
    }

    const form = new FormData();
    form.append("data", JSON.stringify(toPayload(draft)));
    form.append("startedAt", String(startedAt.current ?? Date.now()));
    form.append("website", honeypot);
    photos.filter((p) => p.status === "ready" && p.file).forEach((p) => form.append("fotos", p.file!, p.file!.name));

    setSubmit({ status: "sending" });
    setAnnouncement("Enviando tu solicitud…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        body: form,
        headers: { "Idempotency-Key": idempotency.current.key },
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; reference: string }
        | { ok: false; code?: string; message?: string; fieldErrors?: Record<string, string> }
        | null;
      if (res.ok && body?.ok) {
        setSubmit({ status: "success", reference: body.reference });
        setAnnouncement("Solicitud enviada correctamente.");
        window.scrollTo({ top: 0 });
        return;
      }
      const failure = body && !body.ok ? body : null;
      const fieldErrors = failure?.fieldErrors;
      const steps = fieldErrors ? [...new Set(Object.keys(fieldErrors).map(stepForField))] : undefined;
      let message = failure?.message ?? "No hemos podido enviar tu solicitud. Inténtalo de nuevo.";
      if (res.status === 413) message = "Las fotografías ocupan demasiado. Elimina alguna e inténtalo de nuevo.";
      if (res.status >= 500 && !failure?.message) message = "Ha habido un problema en nuestro servidor. Inténtalo de nuevo en unos minutos.";
      setSubmit({ status: "error", error: { message, fieldErrors, steps } });
      setAnnouncement(message);
    } catch {
      const message = "No hemos podido conectar con el servidor. Revisa tu conexión a internet y vuelve a intentarlo.";
      setSubmit({ status: "error", error: { message } });
      setAnnouncement(message);
    } finally {
      clearTimeout(timer);
    }
  };

  /* ------------------------------ Éxito -------------------------------- */

  if (submit.status === "success") {
    const message = buildWhatsAppMessage({
      name: draft.contact.name,
      reform: reformTitle(draft),
      locality: draft.location.locality,
      description: draft.description || draft.details.otra?.description,
      reference: submit.reference,
    });
    return (
      <MotionConfig reducedMotion="user">
        <SuccessScreen
          firstName={draft.contact.name.trim().split(/\s+/)[0] ?? ""}
          reference={submit.reference}
          whatsappUrl={hasWhatsApp() ? buildWhatsAppUrl(siteConfig.contact.whatsapp, message) : null}
        />
      </MotionConfig>
    );
  }

  /* ------------------------------ Render ------------------------------- */

  const media = draft.reform.primary ? REFORM_MEDIA[draft.reform.primary] : DEFAULT_MEDIA;
  const progress = (Math.min(stepIndex, SUMMARY_INDEX) + 1) / (TOTAL_STEPS + 1);
  const sending = submit.status === "sending";
  const primaryLabel = isSummary
    ? "Enviar mi solicitud"
    : returnToSummary
      ? "Guardar y volver al resumen"
      : step === "contacto"
        ? "Revisar mi solicitud"
        : "Continuar";

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white lg:grid lg:h-dvh lg:grid-cols-[minmax(340px,36%)_1fr] lg:overflow-hidden">
        {/* ------------------------- Panel lateral ------------------------- */}
        <aside className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex lg:flex-col" aria-label="Progreso de la solicitud">
          <AnimatePresence initial={false}>
            <motion.div
              key={media.src.src}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            >
              <Image src={media.src} alt="" fill sizes="36vw" className="object-cover" placeholder="blur" preload={!draft.reform.primary} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-950/55 to-navy-950/95" />

          <div className="relative flex h-full flex-col px-10 pt-9 pb-10 xl:px-12">
            {/* Enlace normal (no Link) para que el navegador avise si hay datos sin enviar. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navegación completa para que salte el aviso de datos sin enviar */}
            <a href="/" aria-label="Excellence Reformas, ir al inicio" className="w-fit rounded-md">
              <Logo className="h-16 w-auto text-white" decorative />
            </a>

            <div className="mt-12">
              <p className="text-xs font-bold tracking-[0.22em] text-steel-soft uppercase">Excellence Smart Budget</p>
              <p className="font-display-tight mt-3 text-4xl leading-[0.95] uppercase xl:text-5xl">
                Tu casa también merece un <span className="text-steel-soft">Glow Up</span>
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/75">
                <IconClock size={16} /> Unos 2 minutos · Sin compromiso
              </p>
            </div>

            <nav aria-label="Pasos" className="mt-10">
              <ol className="space-y-1">
                {STEPS.map((s, i) => {
                  const done = i < stepIndex || (isSummary && i < SUMMARY_INDEX);
                  const current = i === stepIndex;
                  const reachable = i <= furthest && !current;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        disabled={!reachable}
                        aria-current={current ? "step" : undefined}
                        className={cx(
                          "group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[15px] transition",
                          current ? "text-white" : reachable ? "text-white/75 hover:bg-white/8 hover:text-white" : "text-white/40",
                        )}
                      >
                        <span
                          className={cx(
                            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                            current ? "bg-white text-navy" : done ? "bg-steel/40 text-white" : "ring-1 ring-white/25",
                          )}
                        >
                          {done && !current ? <IconCheck size={14} strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={cx(current && "font-bold")}>{s.short}</span>
                        {done && !current && reachable && <span className="sr-only">(completado, volver a este paso)</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="mt-auto pt-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                  className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-[15px] leading-relaxed ring-1 ring-white/15 backdrop-blur-md"
                >
                  <IconSpark size={20} className="mt-0.5 shrink-0 text-steel-soft" />
                  <span>«{STEP_MESSAGES[step]}»</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* -------------------------- Contenido --------------------------- */}
        <div className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0">
          <header className="sticky top-0 z-20 border-b border-navy/8 bg-white/92 backdrop-blur-md lg:static lg:border-0 lg:bg-white">
            <div className="flex items-center justify-between gap-4 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-8 lg:px-12 lg:pt-8">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navegación completa para que salte el aviso de datos sin enviar */}
              <a href="/" aria-label="Excellence Reformas, ir al inicio" className="rounded-md lg:hidden">
                <Logo className="h-10 w-auto text-navy" decorative />
              </a>
              <p className="hidden text-sm font-semibold text-steel-ink lg:block" aria-hidden="true">
                {isSummary ? "Resumen final" : `Paso ${stepIndex + 1} de ${TOTAL_STEPS}`}
                <span className="text-navy/30"> · </span>
                <span className="text-navy">{isSummary ? "Revisa y envía" : STEPS[stepIndex].short}</span>
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navegación completa para que salte el aviso de datos sin enviar */}
              <a
                href="/"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-steel-ink transition hover:bg-mist hover:text-navy"
              >
                <IconClose size={18} />
                <span>Salir</span>
              </a>
            </div>
            <div className="px-5 pb-3 sm:px-8 lg:px-12 lg:pb-0">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-steel-ink lg:hidden" aria-hidden="true">
                <span>{isSummary ? "Resumen final" : `Paso ${stepIndex + 1} de ${TOTAL_STEPS} · ${STEPS[stepIndex].short}`}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Progreso de la solicitud"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-valuetext={isSummary ? "Resumen final" : `Paso ${stepIndex + 1} de ${TOTAL_STEPS}: ${STEPS[stepIndex].short}`}
                className="h-1.5 overflow-hidden rounded-full bg-mist"
              >
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-steel to-navy"
                  initial={false}
                  animate={{ scaleX: progress }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
              </div>
            </div>
          </header>

          <main ref={scrollRef} id="contenido" className="flex-1 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-5 pt-7 pb-10 sm:px-8 lg:px-12 lg:pt-12">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.section
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  aria-labelledby="step-title"
                >
                  <StepHeader
                    title={copy.title}
                    subtitle={copy.subtitle}
                    message={STEP_MESSAGES[step]}
                    eyebrow={isSummary ? "Resumen" : `Paso ${stepIndex + 1} de ${TOTAL_STEPS}`}
                    focusOnMount={hasNavigated}
                    scrollContainer={scrollRef}
                  />
                  <form
                    id="step-form"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isSummary) void send();
                      else next();
                    }}
                    className="mt-8"
                  >
                    {step === "tipo" && <StepType draft={draft} dispatch={dispatch} errors={visibleErrors} />}
                    {step === "inmueble" && <StepProperty draft={draft} dispatch={dispatch} errors={visibleErrors} />}
                    {step === "detalles" && <StepDetails draft={draft} dispatch={dispatch} errors={visibleErrors} />}
                    {step === "ubicacion" && <StepLocation draft={draft} dispatch={dispatch} errors={visibleErrors} />}
                    {step === "plazos" && <StepPlanning draft={draft} dispatch={dispatch} />}
                    {step === "fotos" && (
                      <StepPhotos
                        draft={draft}
                        dispatch={dispatch}
                        errors={visibleErrors}
                        photos={photos}
                        onAddFiles={addFiles}
                        onRemovePhoto={removePhoto}
                        photoNotice={photoNotice}
                      />
                    )}
                    {step === "contacto" && (
                      <StepContact
                        draft={draft}
                        dispatch={dispatch}
                        errors={visibleErrors}
                        onBlurField={markTouched}
                        honeypot={honeypot}
                        setHoneypot={setHoneypot}
                      />
                    )}
                    {step === "resumen" && (
                      <StepSummary
                        draft={draft}
                        photos={photos}
                        onEdit={edit}
                        error={submit.status === "error" ? submit.error : null}
                      />
                    )}
                  </form>
                </motion.section>
              </AnimatePresence>
            </div>
          </main>

          {/* --------------------------- Acciones --------------------------- */}
          <div className="sticky bottom-0 z-20 border-t border-navy/8 bg-white/95 backdrop-blur-md lg:static">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12 lg:py-5">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  disabled={sending}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-navy ring-1 ring-navy/15 transition hover:ring-navy disabled:opacity-50 sm:px-5"
                >
                  <IconArrowLeft size={18} />
                  Volver
                </button>
              ) : (
                <span className="hidden text-sm text-steel-ink sm:inline">Sin compromiso · Unos 2 minutos</span>
              )}
              <button
                type="submit"
                form="step-form"
                disabled={sending}
                aria-busy={sending || undefined}
                className={cx(
                  "group ml-auto inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-navy px-6 text-[15px] font-extrabold text-white shadow-lift transition hover:bg-navy-800 disabled:cursor-wait sm:px-8",
                  isSummary && "tracking-wide uppercase",
                )}
              >
                {sending ? (
                  <>
                    <span className="size-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
                    Enviando…
                  </>
                ) : (
                  <>
                    {submit.status === "error" && isSummary ? "Reintentar envío" : primaryLabel}
                    <IconArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </MotionConfig>
  );
}

function StepHeader({
  eyebrow,
  title,
  subtitle,
  message,
  focusOnMount,
  scrollContainer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  message: string;
  focusOnMount: boolean;
  scrollContainer: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    window.scrollTo({ top: 0 });
    scrollContainer.current?.scrollTo({ top: 0 });
    ref.current?.focus({ preventScroll: true });
    // Solo al montar cada paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <span id="step-eyebrow" className="sr-only">
        {eyebrow}
      </span>
      <h1
        id="step-title"
        ref={ref}
        tabIndex={-1}
        aria-describedby="step-eyebrow"
        className="font-display-tight text-[2.1rem] leading-[0.98] text-navy uppercase outline-none sm:text-5xl"
      >
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-steel-ink sm:text-lg">{subtitle}</p>
      <p className="mt-4 inline-flex items-start gap-2 rounded-full bg-mist-50 px-3.5 py-2 text-sm font-medium text-navy ring-1 ring-navy/8 lg:hidden">
        <IconSpark size={16} className="mt-0.5 shrink-0 text-steel" />
        {message}
      </p>
    </div>
  );
}
