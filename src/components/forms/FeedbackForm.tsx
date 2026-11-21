"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRef, useState } from "react";
import { hasWhatsApp, siteConfig } from "@/config/site";
import { issuesToFieldErrors } from "@/lib/budget/schema";
import { buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import {
  FEEDBACK_CARE,
  FEEDBACK_HIGHLIGHTS,
  FEEDBACK_STAGES,
  feedbackSchema,
  needsAttention,
  type Feedback,
  type FeedbackInput,
} from "@/lib/forms/feedback";
import { feedbackFields } from "@/lib/forms/netlify-fields";
import { ChoiceGroup, Chip, FieldError, Note, TextArea, TextField } from "@/components/budget/ui";
import { IconAlert, IconArrowRight, IconHeart, IconInfo, IconWhatsApp } from "@/components/icons";
import { budgetHref } from "@/components/site/CtaLink";
import { CheckField } from "./CheckField";
import { ShareButton } from "./ShareButton";
import { StarRating } from "./StarRating";
import { submitCareForm } from "./submit-care";

type State = {
  rating: number;
  stage?: string;
  care?: string;
  highlights: string[];
  comment: string;
  name: string;
  phone: string;
  email: string;
  reference: string;
  callback: boolean;
  publish: boolean;
  privacy: boolean;
};

const initial: State = { rating: 0, highlights: [], comment: "", name: "", phone: "", email: "", reference: "", callback: false, publish: false, privacy: false };

const FIELD_IDS: Record<string, string> = {
  rating: "fb-rating",
  comment: "fb-comment",
  name: "fb-name",
  phone: "fb-phone",
  email: "fb-email",
  privacy: "fb-privacy",
};

export function FeedbackForm({ socials }: { socials: React.ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Feedback | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const unhappy = (s.rating > 0 && s.rating <= 3) || s.care === "no";

  const toInput = (): FeedbackInput => ({
    rating: s.rating,
    stage: s.stage as FeedbackInput["stage"],
    care: s.care as FeedbackInput["care"],
    highlights: s.highlights as FeedbackInput["highlights"],
    comment: s.comment,
    name: s.name,
    phone: s.phone,
    email: s.email,
    reference: s.reference,
    callback: s.callback,
    publish: s.publish,
    privacy: s.privacy as true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const parsed = feedbackSchema.safeParse(toInput());
    if (!parsed.success) {
      const errs = issuesToFieldErrors(parsed.error.issues);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      requestAnimationFrame(() => document.getElementById(FIELD_IDS[first] ?? "fb-rating")?.focus());
      return;
    }
    setStatus("sending");
    const res = await submitCareForm({ form: "valoracion", fields: feedbackFields(parsed.data), payload: parsed.data, honeypot });
    if (res.ok) {
      setSent(parsed.data);
      setStatus("done");
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
    } else {
      setStatus("error");
      setMessage(res.message);
    }
  };

  if (status === "done" && sent) return <Thanks feedback={sent} socials={socials} refEl={topRef} />;

  return (
    <MotionConfig reducedMotion="user">
      <form onSubmit={submit} noValidate className="space-y-10" aria-label="Valora tu experiencia">
        <div>
          <h2 className="text-lg font-bold text-navy sm:text-xl">¿Cómo valorarías tu experiencia con nosotros?</h2>
          <p className="mb-4 text-[15px] text-steel-ink">De 0 a 5 estrellas. Puedes valorar en cualquier momento: antes, durante o después de la obra.</p>
          <StarRating id="fb-rating" value={s.rating} onChange={(v) => set("rating", v)} error={errors.rating} />
          <FieldError id="fb-rating-error">{errors.rating}</FieldError>
        </div>

        <ChoiceGroup legend="¿Te sientes bien atendido?" errorId="fb-care-error">
          <div className="flex flex-wrap gap-2.5">
            {FEEDBACK_CARE.map((o) => (
              <Chip key={o.id} type="radio" name="care" value={o.id} label={o.label} checked={s.care === o.id} onChange={() => set("care", o.id)} />
            ))}
          </div>
        </ChoiceGroup>

        <ChoiceGroup legend="¿En qué momento estás?" optional errorId="fb-stage-error">
          <div className="flex flex-wrap gap-2.5">
            {FEEDBACK_STAGES.map((o) => (
              <Chip key={o.id} type="radio" name="stage" value={o.id} label={o.label} checked={s.stage === o.id} onChange={() => set("stage", o.id)} />
            ))}
          </div>
        </ChoiceGroup>

        <ChoiceGroup legend="¿Qué destacarías?" description="Puedes marcar varias opciones." optional errorId="fb-hl-error">
          <div className="flex flex-wrap gap-2.5">
            {FEEDBACK_HIGHLIGHTS.map((o) => (
              <Chip
                key={o.id}
                type="checkbox"
                name="highlights"
                value={o.id}
                label={o.label}
                checked={s.highlights.includes(o.id)}
                onChange={() => set("highlights", s.highlights.includes(o.id) ? s.highlights.filter((h) => h !== o.id) : [...s.highlights, o.id])}
              />
            ))}
          </div>
        </ChoiceGroup>

        <AnimatePresence initial={false}>
          {unhappy && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Note icon={<IconHeart size={20} />}>
                <strong className="font-bold">Sentimos que algo no esté yendo bien.</strong> Cuéntanos qué ha pasado: {siteConfig.owner} lo leerá
                personalmente y queremos solucionarlo contigo.
              </Note>
            </motion.div>
          )}
        </AnimatePresence>

        <TextArea
          id="fb-comment"
          label={unhappy ? "Cuéntanos qué ha pasado" : "¿Quieres contarnos algo más?"}
          optional
          maxLength={1500}
          rows={4}
          value={s.comment}
          onChange={(e) => set("comment", e.target.value)}
          placeholder={unhappy ? "Por ejemplo: la obra va más lenta de lo que esperaba…" : "Lo que más te ha gustado, lo que podríamos mejorar…"}
          error={errors.comment}
        />

        <div className="space-y-5">
          <CheckField id="fb-callback" checked={s.callback} onChange={(v) => set("callback", v)} tone={unhappy ? "highlight" : "default"}>
            <strong className="font-bold">Quiero que {siteConfig.owner} me contacte</strong> para hablarlo.
          </CheckField>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="fb-name" label="Nombre" optional autoComplete="name" maxLength={100} value={s.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
            <TextField id="fb-reference" label="Referencia de tu solicitud" optional maxLength={20} placeholder="ER-…" value={s.reference} onChange={(e) => set("reference", e.target.value)} />
            <TextField
              id="fb-phone"
              label="Teléfono"
              optional={!s.callback}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
              value={s.phone}
              onChange={(e) => set("phone", e.target.value)}
              error={errors.phone}
            />
            <TextField
              id="fb-email"
              label="Email"
              optional
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              value={s.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              hint="Si nos lo dejas, te enviaremos un email de agradecimiento."
            />
          </div>
          <CheckField id="fb-publish" checked={s.publish} onChange={(v) => set("publish", v)}>
            Autorizo a Excellence Reformas a publicar mi opinión en su web con mi nombre e inicial del apellido.
          </CheckField>
          <CheckField id="fb-privacy" checked={s.privacy} onChange={(v) => set("privacy", v)} error={errors.privacy}>
            He leído y acepto la{" "}
            <Link href="/politica-de-privacidad" target="_blank" rel="noopener" className="font-bold underline decoration-steel underline-offset-4">
              política de privacidad
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </Link>
            .
          </CheckField>
        </div>

        <div className="sr-only" aria-hidden="true">
          <label htmlFor="fb-website">No rellenes este campo</label>
          <input id="fb-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {status === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger/5 p-4 font-semibold text-danger">
            <IconAlert size={20} className="mt-0.5 shrink-0" />
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-navy px-8 text-base font-extrabold tracking-wide text-white uppercase shadow-lift transition hover:bg-navy-800 disabled:cursor-wait sm:w-auto"
        >
          {status === "sending" ? "Enviando…" : "Enviar mi valoración"}
          <IconArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="flex items-start gap-2 text-sm text-steel-ink">
          <IconInfo size={18} className="mt-0.5 shrink-0" />
          Tu valoración llega directamente a {siteConfig.owner}. Solo publicaremos tu opinión si nos das permiso.
        </p>
      </form>
    </MotionConfig>
  );
}

function Thanks({ feedback: f, socials, refEl }: { feedback: Feedback; socials: React.ReactNode; refEl: React.RefObject<HTMLDivElement | null> }) {
  const happy = !needsAttention(f);
  const name = f.name?.trim().split(/\s+/)[0];
  const wa = hasWhatsApp()
    ? buildWhatsAppUrl(siteConfig.contact.whatsapp, `Hola ${siteConfig.owner}, soy ${f.name ?? "un cliente"}. Acabo de enviar mi valoración (${f.rating}/5) y me gustaría hablar con vosotros.`)
    : null;
  return (
    <motion.div ref={refEl} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-navy p-7 text-white sm:p-10" role="status">
      <IconHeart size={36} className="text-steel-soft" />
      <h2 className="font-display-tight mt-4 text-4xl leading-[0.95] uppercase sm:text-5xl">
        {happy ? `¡Gracias${name ? `, ${name}` : ""}!` : `Gracias por contárnoslo${name ? `, ${name}` : ""}`}
      </h2>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">
        {happy
          ? "Nos alegra muchísimo que estés contento. Tu opinión nos ayuda a seguir cuidando cada detalle."
          : `${siteConfig.owner} ha recibido tu valoración y quiere que todo vaya bien.${f.callback ? " Te contactaremos para hablarlo." : ""}`}
      </p>
      {f.publish && f.name && (
        <p className="mt-4 max-w-xl rounded-2xl bg-white/10 px-4 py-3 text-[15px] leading-relaxed text-white/90 ring-1 ring-white/15">
          Tu opinión aparecerá en nuestra web en unos minutos, con tu nombre y la inicial de tu apellido.{" "}
          <Link href="/#opiniones" className="font-bold underline underline-offset-4">
            Ver opiniones
          </Link>
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-[#1FAF54] px-6 font-extrabold text-white">
            <IconWhatsApp size={22} />
            {happy ? "Escríbenos por WhatsApp" : "Hablar ahora con Julio César"}
          </a>
        )}
        <ShareButton tone="dark" />
        <Link href={budgetHref()} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-6 font-extrabold text-navy">
          Tu próximo Glow Up
          <IconArrowRight size={18} />
        </Link>
      </div>
      <div className="mt-8 border-t border-white/15 pt-6">
        <p className="mb-3 text-sm font-bold tracking-[0.14em] text-steel-soft uppercase">Síguenos y opina</p>
        {socials}
      </div>
    </motion.div>
  );
}
