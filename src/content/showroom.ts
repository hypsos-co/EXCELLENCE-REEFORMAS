import type { StaticImageData } from "next/image";
import salonColumnasHierro from "@/assets/showroom/salon-columnas-hierro.jpg";
import vestidorConIsla from "@/assets/showroom/vestidor-con-isla.jpg";
import vestibuloSueloVidrio from "@/assets/showroom/vestibulo-suelo-vidrio.jpg";
import cocinaIslaPilaresMadera from "@/assets/showroom/cocina-isla-pilares-madera.jpg";
import banoCelosiasMadera from "@/assets/showroom/bano-celosias-madera.jpg";
import dormitorioPapelTexturizado from "@/assets/showroom/dormitorio-papel-texturizado.jpg";
import cocinaBlancaBrillo from "@/assets/showroom/cocina-blanca-brillo.jpg";
import salonCarpinteriaClasica from "@/assets/showroom/salon-carpinteria-clasica.jpg";
import lavaboPieLuzRasante from "@/assets/showroom/lavabo-pie-luz-rasante.jpg";
import papelPintadoTropical from "@/assets/showroom/papel-pintado-tropical.jpg";
import salonCocinaPilaresNegros from "@/assets/showroom/salon-cocina-pilares-negros.jpg";
import banoLavaboDoble from "@/assets/showroom/bano-lavabo-doble.jpg";
import barraLamparasCristal from "@/assets/showroom/barra-lamparas-cristal.jpg";
import recibidorAzul from "@/assets/showroom/recibidor-azul.jpg";
import plantaDiafanaPilaresMadera from "@/assets/showroom/planta-diafana-pilares-madera.jpg";
import lavaboEncimeraMadera from "@/assets/showroom/lavabo-encimera-madera.jpg";
import comedorNordico from "@/assets/showroom/comedor-nordico.jpg";
import pasilloPapelPintadoLed from "@/assets/showroom/pasillo-papel-pintado-led.jpg";
import cocinaPeninsulaMarmol from "@/assets/showroom/cocina-peninsula-marmol.jpg";
import salaReunionesAcristalada from "@/assets/showroom/sala-reuniones-acristalada.jpg";
import duchaAzulejoGeometrico from "@/assets/showroom/ducha-azulejo-geometrico.jpg";
import dormitorioCabeceroTapizado from "@/assets/showroom/dormitorio-cabecero-tapizado.jpg";
import cocinaMesaMaderaMaciza from "@/assets/showroom/cocina-mesa-madera-maciza.jpg";
import papelPintadoPeces from "@/assets/showroom/papel-pintado-peces.jpg";
import pasilloArmariosEmpotrados from "@/assets/showroom/pasillo-armarios-empotrados.jpg";
import banoPrincipalBaneraObra from "@/assets/showroom/bano-principal-banera-obra.jpg";
import comedorLuzCalida from "@/assets/showroom/comedor-luz-calida.jpg";
import armarioIluminadoMedida from "@/assets/showroom/armario-iluminado-medida.jpg";
import boiseriePapelTopos from "@/assets/showroom/boiserie-papel-topos.jpg";
import lavaboRevestimiento3d from "@/assets/showroom/lavabo-revestimiento-3d.jpg";
import oficinaPlantaAbierta from "@/assets/showroom/oficina-planta-abierta.jpg";
import salonEstanteriaDiseno from "@/assets/showroom/salon-estanteria-diseno.jpg";
import dormitorioParquetEspiga from "@/assets/showroom/dormitorio-parquet-espiga.jpg";
import pilarPintadoRayas from "@/assets/showroom/pilar-pintado-rayas.jpg";
import cocinaLineasPuras from "@/assets/showroom/cocina-lineas-puras.jpg";
import pasilloPuertaMaderaForja from "@/assets/showroom/pasillo-puerta-madera-forja.jpg";
import duchaAzulejoGris from "@/assets/showroom/ducha-azulejo-gris.jpg";
import vestidorAbierto from "@/assets/showroom/vestidor-abierto.jpg";
import papelPintadoBotanico from "@/assets/showroom/papel-pintado-botanico.jpg";
import salonAbiertoCocina from "@/assets/showroom/salon-abierto-cocina.jpg";
import banoAcabadoContinuo from "@/assets/showroom/bano-acabado-continuo.jpg";
import armarioPuertasEspejo from "@/assets/showroom/armario-puertas-espejo.jpg";
import zonaEstudioBarraMadera from "@/assets/showroom/zona-estudio-barra-madera.jpg";
import baneraConMampara from "@/assets/showroom/banera-con-mampara.jpg";
import dormitorioParedRayas from "@/assets/showroom/dormitorio-pared-rayas.jpg";

/**
 * SHOWROOM · trabajos reales de Excellence Reformas.
 * Fotografías seleccionadas de la carpeta de Drive «TRABAJO»: solo obra
 * terminada, sin personas ni objetos personales. Retocadas de forma suave y
 * sin metadatos. Para añadir una foto: guárdala en src/assets/showroom/,
 * impórtala aquí y añádela a SHOWROOM_PHOTOS.
 */

export const SHOWROOM_CATEGORIES = [
  { id: "salones", label: "Salones y comedores", short: "Salones" },
  { id: "cocinas", label: "Cocinas", short: "Cocinas" },
  { id: "banos", label: "Baños", short: "Baños" },
  { id: "dormitorios", label: "Dormitorios y vestidores", short: "Dormitorios" },
  { id: "pasillos", label: "Pasillos y recibidores", short: "Pasillos" },
  { id: "decoracion", label: "Pintura y papel pintado", short: "Decoración" },
  { id: "trabajo", label: "Oficinas y estudios", short: "Oficinas" },
] as const;

export type ShowroomCategory = (typeof SHOWROOM_CATEGORIES)[number]["id"];

export type ShowroomPhoto = {
  id: string;
  src: StaticImageData;
  category: ShowroomCategory;
  title: string;
  description: string;
};

export const SHOWROOM_PHOTOS: ShowroomPhoto[] = [
  { id: "salon-columnas-hierro", src: salonColumnasHierro, category: "salones", title: "Salón diáfano con columnas de hierro", description: "Suelo laminado de roble, paredes en gris perla y columnas de fundición." },
  { id: "vestidor-con-isla", src: vestidorConIsla, category: "dormitorios", title: "Vestidor con isla", description: "Isla con cajones y vitrina, y baldas iluminadas con tira LED." },
  { id: "vestibulo-suelo-vidrio", src: vestibuloSueloVidrio, category: "pasillos", title: "Vestíbulo con suelo de vidrio iluminado", description: "Vidrio retroiluminado sobre cantos rodados entre armarios vitrina." },
  { id: "cocina-isla-pilares-madera", src: cocinaIslaPilaresMadera, category: "cocinas", title: "Cocina abierta entre pilares de madera", description: "Isla blanca, columnas de cocina en gris y pilares de madera a la vista." },
  { id: "bano-celosias-madera", src: banoCelosiasMadera, category: "banos", title: "Baño con celosías de madera", description: "Mamparas de madera de diseño, iluminación indirecta y lavabo negro." },
  { id: "dormitorio-papel-texturizado", src: dormitorioPapelTexturizado, category: "dormitorios", title: "Dormitorio con papel texturizado", description: "Pared en gris antracita, cabecero blanco y suelo efecto madera." },
  { id: "cocina-blanca-brillo", src: cocinaBlancaBrillo, category: "cocinas", title: "Cocina blanca brillo", description: "Frentes lacados sin tiradores, con horno y microondas en columna." },
  { id: "salon-carpinteria-clasica", src: salonCarpinteriaClasica, category: "salones", title: "Salón con carpintería clásica", description: "Ventanales de madera, focos empotrados y suelo continuo en gris." },
  { id: "lavabo-pie-luz-rasante", src: lavaboPieLuzRasante, category: "banos", title: "Lavabo de pie con luz rasante", description: "Acabado continuo y LED perimetral en el suelo y en el techo." },
  { id: "papel-pintado-tropical", src: papelPintadoTropical, category: "decoracion", title: "Mural tropical", description: "Papel pintado de hojas y flamencos en una pared del salón." },
  { id: "salon-cocina-pilares-negros", src: salonCocinaPilaresNegros, category: "salones", title: "Salón-cocina con pilares negros", description: "Techo con iluminación LED indirecta y suelo de madera natural." },
  { id: "bano-lavabo-doble", src: banoLavaboDoble, category: "banos", title: "Baño con lavabo doble", description: "Mueble suspendido, bañera con mampara y gres efecto piedra." },
  { id: "barra-lamparas-cristal", src: barraLamparasCristal, category: "cocinas", title: "Barra con lámparas de cristal", description: "Península blanca y lámparas colgantes de cristal y latón." },
  { id: "recibidor-azul", src: recibidorAzul, category: "pasillos", title: "Recibidor en azul profundo", description: "Pared en azul intenso, puertas blancas y suelo de madera." },
  { id: "planta-diafana-pilares-madera", src: plantaDiafanaPilaresMadera, category: "salones", title: "Planta diáfana con pilares de madera", description: "Pilares y vigas de madera a la vista, suelo de roble y luz indirecta." },
  { id: "lavabo-encimera-madera", src: lavaboEncimeraMadera, category: "banos", title: "Lavabo sobre encimera de madera", description: "Mueble de hierro y madera, espejo con marco negro y luz indirecta." },
  { id: "comedor-nordico", src: comedorNordico, category: "salones", title: "Comedor de estilo nórdico", description: "Mesa de madera, lámparas colgantes y paredes en gris claro." },
  { id: "pasillo-papel-pintado-led", src: pasilloPapelPintadoLed, category: "pasillos", title: "Pasillo con papel pintado y LED", description: "Foseado con luz indirecta y papel pintado de pájaros." },
  { id: "cocina-peninsula-marmol", src: cocinaPeninsulaMarmol, category: "cocinas", title: "Cocina con península efecto mármol", description: "Encimera con veta de mármol y electrodomésticos integrados." },
  { id: "sala-reuniones-acristalada", src: salaReunionesAcristalada, category: "trabajo", title: "Sala de reuniones acristalada", description: "Cubo de vidrio con LED perimetral en una oficina de techo industrial." },
  { id: "ducha-azulejo-geometrico", src: duchaAzulejoGeometrico, category: "banos", title: "Ducha con azulejo geométrico", description: "Mampara corredera y pared con motivo geométrico en gris." },
  { id: "dormitorio-cabecero-tapizado", src: dormitorioCabeceroTapizado, category: "dormitorios", title: "Dormitorio con cabecero tapizado", description: "Luz cálida, ropa de cama clara y lámpara de techo de diseño." },
  { id: "cocina-mesa-madera-maciza", src: cocinaMesaMaderaMaciza, category: "cocinas", title: "Cocina con mesa de madera maciza", description: "Barra de madera natural, frentes blancos y suelo oscuro." },
  { id: "papel-pintado-peces", src: papelPintadoPeces, category: "decoracion", title: "Papel pintado de peces", description: "Papel decorativo y puerta corredera integrada en la pared." },
  { id: "pasillo-armarios-empotrados", src: pasilloArmariosEmpotrados, category: "pasillos", title: "Pasillo con armarios empotrados", description: "Armarios lacados en blanco a ambos lados y focos empotrados." },
  { id: "bano-principal-banera-obra", src: banoPrincipalBaneraObra, category: "banos", title: "Baño principal con bañera de obra", description: "Encimera de madera, lavabo sobre encimera y cenefa en el suelo." },
  { id: "comedor-luz-calida", src: comedorLuzCalida, category: "salones", title: "Comedor con luz cálida", description: "Cortinas de lino, carpintería blanca y lámpara de latón." },
  { id: "armario-iluminado-medida", src: armarioIluminadoMedida, category: "dormitorios", title: "Armario iluminado", description: "Interior con luz LED, barras de colgar y cajonera." },
  { id: "boiserie-papel-topos", src: boiseriePapelTopos, category: "decoracion", title: "Boiserie y papel de topos", description: "Zócalo de molduras blancas con papel pintado en gris." },
  { id: "lavabo-revestimiento-3d", src: lavaboRevestimiento3d, category: "banos", title: "Lavabo con revestimiento 3D", description: "Azulejo negro con relieve, mueble blanco y espejo con luz." },
  { id: "oficina-planta-abierta", src: oficinaPlantaAbierta, category: "trabajo", title: "Oficina de planta abierta", description: "Techo industrial a la vista, suelo continuo y zona de reuniones." },
  { id: "salon-estanteria-diseno", src: salonEstanteriaDiseno, category: "salones", title: "Salón con estantería de diseño", description: "Módulos en negro y madera, sofás en gris y luz cálida." },
  { id: "dormitorio-parquet-espiga", src: dormitorioParquetEspiga, category: "dormitorios", title: "Dormitorio con parquet en espiga", description: "Suelo de madera en espiga y paredes en blanco roto." },
  { id: "pilar-pintado-rayas", src: pilarPintadoRayas, category: "decoracion", title: "Pilar pintado a rayas", description: "Pintura decorativa en franjas de color arena y blanco." },
  { id: "cocina-lineas-puras", src: cocinaLineasPuras, category: "cocinas", title: "Cocina de líneas puras", description: "Columnas de suelo a techo con hornos integrados y suelo continuo." },
  { id: "pasillo-puerta-madera-forja", src: pasilloPuertaMaderaForja, category: "pasillos", title: "Pasillo con puerta de madera y forja", description: "Puerta de madera con montante de forja y paredes en gris claro." },
  { id: "ducha-azulejo-gris", src: duchaAzulejoGris, category: "banos", title: "Ducha con revestimiento en gris", description: "Azulejo tipo listón en grises y columna de ducha." },
  { id: "vestidor-abierto", src: vestidorAbierto, category: "dormitorios", title: "Vestidor abierto", description: "Módulos con cajones y baldas en tono piedra." },
  { id: "papel-pintado-botanico", src: papelPintadoBotanico, category: "decoracion", title: "Papel pintado botánico", description: "Estampado de hojas y frutos en verde y amarillo." },
  { id: "salon-abierto-cocina", src: salonAbiertoCocina, category: "salones", title: "Salón abierto a la cocina", description: "Espacio integrado con zona de estar, cocina y salida a la terraza." },
  { id: "bano-acabado-continuo", src: banoAcabadoContinuo, category: "banos", title: "Baño con acabado continuo", description: "Paredes sin juntas, ducha con cristal y encimera gris." },
  { id: "armario-puertas-espejo", src: armarioPuertasEspejo, category: "dormitorios", title: "Armario con puertas de espejo", description: "Correderas de espejo y suelo laminado en gris." },
  { id: "zona-estudio-barra-madera", src: zonaEstudioBarraMadera, category: "trabajo", title: "Zona de estudio", description: "Barra de madera de pino, taburetes y pizarra en la pared." },
  { id: "banera-con-mampara", src: baneraConMampara, category: "banos", title: "Bañera con mampara", description: "Combinación de gris y blanco con frente de bañera revestido." },
  { id: "dormitorio-pared-rayas", src: dormitorioParedRayas, category: "decoracion", title: "Dormitorio con pared a rayas", description: "Franjas horizontales en arena y blanco sobre suelo de madera." },
];

export function categoryLabel(id: ShowroomCategory): string {
  return SHOWROOM_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
