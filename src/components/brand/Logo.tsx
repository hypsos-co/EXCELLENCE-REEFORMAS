import { HOUSES_PATHS, LOGO_VIEWBOX, TAGLINE_GLYPHS, WORDMARK_PATHS } from "./logo-paths";

type LogoProps = {
  className?: string;
  /** Texto accesible. Si el logo es decorativo junto a texto visible, pasa `decorative`. */
  title?: string;
  decorative?: boolean;
};

/**
 * Logotipo oficial de EXCELLENCE REFORMAS (vectorial, hereda `color`).
 * Usa `text-navy` o `text-white` para cambiar el color.
 */
export function Logo({ className, title = "Excellence Reformas", decorative = false }: LogoProps) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      {HOUSES_PATHS.map((d, i) => (
        <path key={`h${i}`} d={d} />
      ))}
      {WORDMARK_PATHS.map((d, i) => (
        <path key={`w${i}`} d={d} />
      ))}
      {TAGLINE_GLYPHS.map(([x, y, d], i) => (
        <path key={`t${i}`} d={d} transform={`translate(${x} ${y})`} />
      ))}
    </svg>
  );
}

/** Solo las casas del logotipo (para detalles decorativos). */
export function LogoHouses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 920 272" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      {HOUSES_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
