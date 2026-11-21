"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { hasWhatsApp, siteConfig } from "@/config/site";
import { issuesToFieldErrors } from "@/lib/budget/schema";
import { buildWhatsAppUrl } from "@/lib/budget/whatsapp";
import { AFTERCARE_KINDS, AFTERCARE_MAX_PHOTOS, AFTERCARE_URGENCY, aftercareSchema, type AftercareInput } from "@/lib/forms/aftercare";
import { aftercareFields } from "@/lib/forms/netlify-fields";
import { UPLOAD_LIMITS } from "@/lib/budget/uploads";
import { preparePhoto } from "@/components/budget/photos";
import { ChoiceGroup, Chip, TextArea, TextField } from "@/components/budget/ui";
import { IconAlert, IconArrowRight, IconCamera, IconCheck, IconTrash, IconWhatsApp } from "@/components/icons";
import { CheckField } from "./CheckField";
import { submitCareForm } from "./submit-care";

type Photo = { id: string; file?: File; url?: string; name: string; busy: boolean; error?: string };

const IDS: Record<string, string> = { kind: "ac-kind", description: "ac-description", name: "ac-name", phone: "ac-phone", email: "ac-email", privacy: "ac-privacy" };

export function AftercareForm() {
  const [kind, setKind] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("normal");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locality, setLocality] = useState("");
  const [reference, setReference] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    const room = AFTERCARE_MAX_PHOTOS - photos.length;
    files.slice(0, Math.max(0, room)).forEach(async (file) => {
      const id = Math.random().toString(36).slice(2);
      setPhotos((p) => [...p, { id, name: file.name, busy: true }]);
      const r = await preparePhoto(file);
      setPhotos((p) =>
        p.map((x) =>
          x.id !== id ? x : "error" in r ? { ...x, busy: false, error: r.error } : { ...x, busy: false, file: r.file, url: r.previewUrl },
        ),
      );
    });
  };

  const input = (): AftercareInput => ({
    kind: kind as AftercareInput["kind"],
    urgency: urgency as AftercareInput["urgency"],
    description,
    name,
    phone,
    email,
    locality,
    reference,
    privacy: privacy as true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || photos.some((p) => p.busy)) return;
    const parsed = aftercareSchema.safeParse(input());
    if (!parsed.success) {
      const errs = issuesToFieldErrors(parsed.error.issues);
      setErrors(errs);
      requestAnimationFrame(() => document.getElementById(IDS[Object.keys(errs)[0]] ?? "ac-kind")?.focus());
      return;
    }
    setErrors({});
    setStatus("sending");
    const files = photos.filter((p) => p.file).map((p) => p.file!);
    const res = await submitCareForm({ form: "posventa", fields: aftercareFields(parsed.data), payload: parsed.data, files, honeypot });
    if (res.ok) setStatus("done");
    else {
      setStatus("error");
      setMessage(res.message);
    }
  };

  if (status === "done") {
    const wa = hasWhatsApp()
      ? buildWhatsAppUrl(siteConfig.contact.whatsapp, `Hola ${siteConfig.owner}, soy ${name.trim()}. Acabo de enviaros una consulta desde el área de clientes.`)
      : null;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status" className="rounded-3xl bg-navy p-7 text-white sm:p-9">
        <span className="grid size-14 place-items-center rounded-full bg-white text-navy">
          <IconCheck size={28} strokeWidth={2.5} />
        </span>
        <h3 className="font-display-tight mt-5 text-4xl leading-[0.95] uppercase">Recibido, {name.trim().split(/\s+/)[0]}</h3>
        <p className="mt-3 max-w-lg text-lg text-white/85">
          {siteConfig.owner} revisará tu consulta y se pondrá en contacto contigo. Gracias por seguir confiando en nosotros.
        </p>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-13 items-center gap-2.5 rounded-full bg-[#1FAF54] px-6 font-extrabold text-white">
            <IconWhatsApp size={22} /> Escribir por WhatsApp
          </a>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8" aria-label="Solicitar una revisión o ayuda">
      <ChoiceGroup legend="¿Qué necesitas?" errorId="ac-kind-error" error={errors.kind}>
        <div className="flex flex-wrap gap-2.5">
          {AFTERCARE_KINDS.map((o, i) => (
            <Chip key={o.id} id={i === 0 ? "ac-kind" : undefined} type="radio" name="ac-kind" value={o.id} label={o.label} checked={kind === o.id} onChange={() => setKind(o.id)} />
          ))}
        </div>
      </ChoiceGroup>

      <TextArea
        id="ac-description"
        label="Cuéntanos qué ocurre"
        maxLength={1500}
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Por ejemplo: la junta de la ducha se ha oscurecido, una puerta del armario roza…"
        error={errors.description}
      />

      <ChoiceGroup legend="¿Es urgente?" errorId="ac-urgency-error">
        <div className="flex flex-wrap gap-2.5">
          {AFTERCARE_URGENCY.map((o) => (
            <Chip key={o.id} type="radio" name="ac-urgency" value={o.id} label={o.label} checked={urgency === o.id} onChange={() => setUrgency(o.id)} />
          ))}
        </div>
      </ChoiceGroup>

      <div>
        <p className="mb-1 text-[15px] font-bold text-navy">
          Fotos <span className="ml-2 text-xs font-semibold tracking-wide text-steel-ink uppercase">Opcional · hasta {AFTERCARE_MAX_PHOTOS}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.id} className="relative size-24 overflow-hidden rounded-xl bg-mist ring-1 ring-navy/10">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa local
                <img src={p.url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center p-2 text-center text-[11px] text-steel-ink">{p.busy ? "Optimizando…" : p.error ?? p.name}</span>
              )}
              <button
                type="button"
                onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                aria-label={`Eliminar foto ${i + 1}`}
                className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-navy-950/75 text-white"
              >
                <IconTrash size={14} />
              </button>
            </div>
          ))}
          {photos.length < AFTERCARE_MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-navy/20 bg-mist-50 text-navy transition hover:border-navy/50"
            >
              <span className="flex flex-col items-center gap-1 text-xs font-bold">
                <IconCamera size={22} /> Añadir
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={UPLOAD_LIMITS.acceptAttribute}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              addFiles(files);
            }}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="ac-name" label="Nombre y apellidos" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField id="ac-phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        <TextField id="ac-email" label="Email" optional type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField id="ac-locality" label="Localidad" optional autoComplete="address-level2" maxLength={80} value={locality} onChange={(e) => setLocality(e.target.value)} />
        <TextField id="ac-reference" label="Referencia de tu obra" optional maxLength={20} placeholder="ER-…" value={reference} onChange={(e) => setReference(e.target.value)} className="sm:col-span-2" />
      </div>

      <CheckField id="ac-privacy" checked={privacy} onChange={setPrivacy} error={errors.privacy}>
        He leído y acepto la{" "}
        <Link href="/politica-de-privacidad" target="_blank" rel="noopener" className="font-bold underline decoration-steel underline-offset-4">
          política de privacidad
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </Link>
        .
      </CheckField>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="ac-website">No rellenes este campo</label>
        <input id="ac-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
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
        className="group inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-navy px-8 text-base font-extrabold text-white shadow-lift transition hover:bg-navy-800 disabled:cursor-wait sm:w-auto"
      >
        {status === "sending" ? "Enviando…" : "Enviar consulta"}
        <IconArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
