"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cx } from "@/lib/cx";
import { budgetHref } from "@/components/site/CtaLink";
import type { Ambient } from "./ambient";
import type { NightScene } from "./scene";

/**
 * Portada inmersiva «Valle de luz»: escena 3D propia a pantalla completa con
 * los colores de Excellence Reformas. Sin WebGL o con «reducir movimiento»
 * se muestra una versión estática.
 */
export function HeroNight() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<NightScene | null>(null);
  const ambientRef = useRef<Ambient | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [uiOn, setUiOn] = useState(false);
  const [sound, setSound] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [gather, setGather] = useState(false);

  useEffect(() => {
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const failsafe = window.setTimeout(() => {
      setLoaded(true);
      setUiOn(true);
    }, 5000);

    // Sin WebGL no se descarga three.js: se muestra el cielo estático.
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    const loadScene: Promise<typeof import("./scene")> = gl ? import("./scene") : Promise.reject(new Error("WebGL no disponible"));
    loadScene
      .then(({ createNightScene }) => {
        if (disposed || !canvasRef.current) return;
        sceneRef.current = createNightScene(canvasRef.current, {
          reduced,
          mobile,
          onLoaded: () => setLoaded(true),
          onIntroDone: () => setUiOn(true),
        });
      })
      .catch(() => {
        setFallback(true);
        setLoaded(true);
        setUiOn(true);
      });

    const onScroll = () => {
      const h = sectionRef.current?.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      sceneRef.current?.setScroll(p);
      sectionRef.current?.style.setProperty("--p", p.toFixed(3));
    };
    const onResize = () => sceneRef.current?.resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    return () => {
      disposed = true;
      window.clearTimeout(failsafe);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      ambientRef.current?.dispose();
      ambientRef.current = null;
    };
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    sceneRef.current?.pointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  const toggleSound = async () => {
    if (!ambientRef.current) {
      const { createAmbient } = await import("./ambient");
      ambientRef.current = createAmbient();
    }
    const next = !sound;
    ambientRef.current?.setOn(next);
    setSound(next);
  };

  const assemble = (on: boolean) => {
    setGather(on && !fallback);
    sceneRef.current?.assemble(on);
    ambientRef.current?.muffle(on);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-titulo"
      onPointerMove={onPointerMove}
      onPointerLeave={() => sceneRef.current?.pointer(null)}
      className="hero-night relative -mt-18 h-[100svh] min-h-[620px] overflow-hidden bg-[#06111f] text-white lg:-mt-20"
    >
      <div aria-hidden="true" className="hero-night-sky absolute inset-0" />
      {fallback && <div aria-hidden="true" className="hero-night-fallback absolute inset-0" />}
      <div ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
      {/* viñeta y bruma inferior */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,transparent_50%,rgba(6,17,31,.55)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06111f]/80 to-transparent"
      />

      <div
        className={cx(
          "pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ease-out",
          uiOn ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: "translateY(calc(var(--p, 0) * -60px))",
          opacity: "calc(1 - var(--p, 0) * 2.2)",
        }}
      >
        <div className="absolute inset-x-5 top-1/2 flex -translate-y-[44%] flex-col items-center text-center sm:inset-x-8">
          <div className={cx("flex flex-col items-center transition-opacity duration-700 ease-out", gather && "opacity-[0.04]")}>
            <p className="mb-5 text-xs font-bold tracking-[0.26em] text-steel-soft uppercase sm:text-sm">
              Reformas en {siteConfig.serviceArea.label}
            </p>
            <h1
              id="hero-titulo"
              className="font-display text-[clamp(56px,15vw,96px)] leading-[0.9] font-semibold tracking-[-0.012em] uppercase [font-stretch:62%] [text-shadow:0_2px_30px_rgba(6,17,31,.6)] sm:text-[clamp(72px,9.6vw,158px)]"
            >
              Tu casa también
              <br />
              merece un <span className="text-steel-soft">Glow Up.</span>
            </h1>
            <p className="mt-8 max-w-md text-[17px] leading-[1.35] text-white/85 [text-shadow:0_1px_16px_rgba(6,17,31,.8)] sm:mt-10 sm:text-xl">
              Reformas integrales, cocinas y baños.
              <br />
              Pensadas para vivirlas.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-9">
            <Link
              href={budgetHref()}
              aria-label="Solicitar presupuesto"
              onPointerEnter={() => assemble(true)}
              onPointerLeave={() => assemble(false)}
              onFocus={() => assemble(true)}
              onBlur={() => assemble(false)}
              className="group pointer-events-auto grid size-16 place-items-center rounded-full border-[1.5px] border-white text-white transition-colors duration-300 hover:bg-white hover:text-navy focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white sm:size-[68px]"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12h16M14 6l6 6-6 6" />
              </svg>
            </Link>
            <span className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">Solicitar presupuesto</span>
          </div>
        </div>

        <div className="absolute bottom-[max(1.75rem,env(safe-area-inset-bottom))] left-5 flex items-center gap-4 text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase sm:left-auto sm:right-30 sm:bottom-11 sm:text-xs">
          <span>Desliza para explorar</span>
          <i aria-hidden="true" className="h-6 w-px bg-white/40" />
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Silenciar sonido ambiente" : "Activar sonido ambiente"}
            className="pointer-events-auto grid size-11 place-items-center rounded-full text-white transition hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path
                className={cx("transition-opacity duration-300", sound ? "opacity-100" : "opacity-0")}
                d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
              />
              <path className={cx("transition-opacity duration-300", sound ? "opacity-0" : "opacity-100")} d="m16 10 4 4m0-4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pantalla de carga */}
      <div
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#06111f] transition-opacity duration-1000",
          loaded ? "opacity-0" : "opacity-100",
        )}
      >
        <span className="hero-night-dot size-2.5 rounded-full bg-white" />
      </div>
    </section>
  );
}
