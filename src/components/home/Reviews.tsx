import { reviewLinkUrl, reviews, type Review } from "@/config/reviews";

/**
 * Opiniones de clientes. Solo se muestra si hay opiniones REALES en
 * `src/config/reviews.ts`; con la lista vacía no se renderiza nada.
 */
export function Reviews() {
  if (reviews.length === 0) return null;
  return (
    <section id="opiniones" aria-labelledby="opiniones-titulo" className="scroll-mt-24 bg-mist-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Opiniones</p>
            <h2 id="opiniones-titulo" className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          {reviewLinkUrl && (
            <a
              href={reviewLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-full px-5 text-[15px] font-bold text-navy ring-1 ring-navy/20 transition hover:ring-navy"
            >
              Déjanos tu opinión
            </a>
          )}
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {reviews.map((r, i) => (
            <li key={`${r.name}-${i}`}>
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const meta = [r.project, r.locality, formatMonth(r.date)].filter(Boolean).join(" · ");
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy/6">
      <div className="flex gap-0.5 text-navy" role="img" aria-label={`${r.rating} de 5 estrellas`}>
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill={i < r.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-[16px] leading-relaxed text-navy">«{r.text}»</blockquote>
      <figcaption className="mt-6 border-t border-navy/8 pt-4">
        <span className="block font-bold text-navy">{r.name}</span>
        {meta && <span className="mt-0.5 block text-sm text-steel-ink">{meta}</span>}
        {r.source && <span className="mt-0.5 block text-xs text-steel-ink">Opinión recibida por {r.source}</span>}
      </figcaption>
    </figure>
  );
}

function formatMonth(ym?: string) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  const month = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  return `${month} de ${y}`;
}
