import type { StaticImageData } from "next/image";
import type { ReformType } from "@/lib/budget/options";
import integral from "@/assets/obras/integral.jpg";
import cocina from "@/assets/obras/cocina.jpg";
import bano from "@/assets/obras/bano.jpg";
import pintura from "@/assets/obras/pintura.jpg";
import albanileria from "@/assets/obras/albanileria.jpg";
import otra from "@/assets/obras/otra.jpg";
import hero from "@/assets/obras/hero.jpg";

/** Fotografías de trabajos reales de Excellence Reformas para cada tipo de reforma. */
export const REFORM_MEDIA: Record<ReformType, { src: StaticImageData; alt: string }> = {
  integral: { src: integral, alt: "Salón amplio reformado con suelo laminado de roble y paredes en gris claro" },
  cocina: { src: cocina, alt: "Cocina blanca con muebles lacados, horno y microondas integrados" },
  bano: { src: bano, alt: "Baño reformado con lavabo doble suspendido y mampara de cristal" },
  pintura: { src: pintura, alt: "Dormitorio con pared pintada a rayas en tonos arena y blanco" },
  albanileria: { src: albanileria, alt: "Estancia con hornacina iluminada y puerta nueva tras una obra" },
  otra: { src: otra, alt: "Pasillo con papel pintado de pájaros y armarios forrados" },
};

export const DEFAULT_MEDIA = { src: hero, alt: "Salón con columnas de hierro fundido y luz natural, reformado por Excellence Reformas" };
