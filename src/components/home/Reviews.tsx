"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { reviewLinkUrl, reviews as configReviews, type Review } from "@/config/reviews";
import { summarize, type PublicReview, type ReviewsPayload } from "@/lib/reviews/public";

/**
 * Opiniones de clientes. Reúne:
 *  - las valoraciones que los clientes envían desde /valoracion y autorizan
 *    a publicar (se guardan de forma permanente; las sirve /api/opiniones), y
 *  - las opiniones reales añadidas a mano en `src/config/reviews.ts`.
 * Sin ninguna opinión, la sección no se muestra.
 */

const PAGE = 6;

function fromConfig(list: Review[]): PublicReview[] {
  return list.map((r, i) => ({
    id: `cfg-${i}`,
    name: r.name,
    rating: r.rating,
    text: r.text,
    stage: [r.project, r.locality].filter(Boolean).join(" · ") || undefined,
    createdAt: r.date && /^\d{4}-\d{2}$/.test(r.date) ? `${r.date}-15T12:00:00Z` : "2000-01-01T00:00:00Z",
  }));
}

export function Reviews() {
  const [data, setData] = useState<ReviewsPayload>(() => summarize(fromConfig(configReviews)));
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/opiniones", { headers: { accept: "application/json" }, signal: ctrl.signal })
      .then((res) => (res.ok && res.headers.get("content-type")?.includes("json") ? (res.json() as Promise<ReviewsPayload>) : null))
      .then((remote) => {
        if (!remote || !Array.isArray(remote.reviews)) return;
        setData(summarize([...remote.reviews, ...fromConfig(configReviews)]));
      })
      .catch(() => {
        /* sin conexión o sin opiniones: se queda lo que haya */
      });
    return () => ctrl.abort();
  }, []);

  if (data.count === 0) return null;
  const avg = data.average ?? 0;

  return (
    <section id="opiniones" aria-labelledby="opiniones-titulo" className="scroll-mt-24 bg-mist-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Opiniones de clientes</p>
            <h2 id="opiniones-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white px-6 py-4 shadow-card ring-1 ring-navy/6">
            <span className="font-display-tight text-5xl leading-none text-navy">{avg.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            <span>
              <Stars rating={Math.round(avg)} label={`Media de ${avg.toLocaleString("es-ES")} sobre 5`} />
              <span className="mt-1 block text-sm font-semibold text-steel-ink">
                {data.count} {data.count === 1 ? "opinión" : "opiniones"}
              </span>
            </span>
          </div>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {data.reviews.slice(0, shown).map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {shown < data.count && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="inline-flex min-h-12 items-center rounded-full bg-navy px-6 text-[15px] font-bold text-white transition hover:bg-navy-800"
            >
              Ver más opiniones
            </button>
          )}
          <Link
            href="/valoracion"
            className="inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-bold text-navy ring-1 ring-navy/20 transition hover:ring-navy"
          >
            ¿Has trabajado con nosotros? Valora tu experiencia
          </Link>
          {reviewLinkUrl && (
            <a
              href={reviewLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-bold text-navy ring-1 ring-navy/20 transition hover:ring-navy"
            >
              Opinar en Google
            </a>
          )}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-steel-ink">
          Opiniones enviadas por clientes desde nuestro formulario de valoración. Publicamos todas las que el cliente autoriza, sin modificar su
          texto; solo retiramos las que contienen spam, insultos o datos personales.
        </p>
      </div>
    </section>
  );
}

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="flex gap-0.5 text-[#F2B01E]" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review: r }: { review: PublicReview }) {
  const meta = [r.stage, formatMonth(r.createdAt)].filter(Boolean).join(" · ");
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy/6">
      <Stars rating={r.rating} label={`${r.rating} de 5 estrellas`} />
      {r.text ? (
        <blockquote className="mt-4 flex-1 text-[16px] leading-relaxed whitespace-pre-line text-navy">«{r.text}»</blockquote>
      ) : (
        <p className="mt-4 flex-1 text-[16px] leading-relaxed text-navy">
          {r.highlights?.length ? `Destaca: ${r.highlights.join(", ").toLowerCase()}.` : `Valoración de ${r.rating} sobre 5.`}
        </p>
      )}
      {r.text && r.highlights?.length ? <p className="mt-3 text-sm text-steel-ink">Destaca: {r.highlights.join(", ").toLowerCase()}</p> : null}
      <figcaption className="mt-6 border-t border-navy/8 pt-4">
        <span className="block font-bold text-navy">{r.name}</span>
        {meta && <span className="mt-0.5 block text-sm text-steel-ink">{meta}</span>}
      </figcaption>
    </figure>
  );
}

function formatMonth(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2001) return "";
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(d);
}
