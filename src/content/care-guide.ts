/**
 * Guía de cuidados para después de la reforma (área de clientes).
 * Consejos generales: siempre prevalecen las indicaciones del fabricante de cada material.
 */
export type CareTopic = { id: string; title: string; intro: string; tips: string[] };

export const CARE_GUIDE: CareTopic[] = [
  {
    id: "suelos-madera",
    title: "Suelos de madera y laminados",
    intro: "Son resistentes, pero el agua estancada y los arañazos son sus enemigos.",
    tips: [
      "Barre o aspira con frecuencia: el polvo y la arena rayan la superficie.",
      "Friega con la mopa bien escurrida y un limpiador neutro para madera. Nunca encharques el suelo.",
      "Seca enseguida cualquier líquido derramado.",
      "Pon fieltros en las patas de sillas y muebles y evita arrastrarlos.",
    ],
  },
  {
    id: "azulejos",
    title: "Azulejos, porcelánico y juntas",
    intro: "Con un poco de constancia, las juntas se mantienen como el primer día.",
    tips: [
      "Limpia con agua templada y detergente neutro; aclara y seca para evitar marcas.",
      "Evita la lejía concentrada y los ácidos en juntas de color: pueden decolorarlas.",
      "Ventila el baño después de ducharte para que no aparezca moho en las juntas.",
      "Si una junta se agrieta o se oscurece mucho, avísanos: es fácil de reparar a tiempo.",
    ],
  },
  {
    id: "microcemento",
    title: "Microcemento y acabados continuos",
    intro: "Un acabado sin juntas muy agradecido si se limpia con suavidad.",
    tips: [
      "Usa jabón de pH neutro diluido en agua y una bayeta o mopa suave.",
      "No uses estropajos, lejía, amoniaco ni desengrasantes fuertes.",
      "Coloca protectores bajo objetos pesados o que puedan rayar.",
      "Renueva la protección (cera o sellador) cuando lo indique el fabricante.",
    ],
  },
  {
    id: "cocina",
    title: "Muebles de cocina y encimeras",
    intro: "La zona que más se usa de la casa: unos gestos sencillos alargan su vida.",
    tips: [
      "Limpia los frentes con un paño suave y agua jabonosa, y sécalos después.",
      "En lacados y brillos, nada de estropajos ni productos abrasivos.",
      "Usa tabla de cortar y salvamanteles: no cortes ni apoyes ollas calientes directamente.",
      "Limpia pronto el vino, el aceite o el limón, sobre todo en piedra natural.",
    ],
  },
  {
    id: "banos",
    title: "Mamparas, grifería y sanitarios",
    intro: "La cal es el principal enemigo del baño, y se previene en segundos.",
    tips: [
      "Pasa una rasqueta por la mampara después de cada ducha.",
      "Para la cal, usa productos antical suaves y aclara bien; evita estropajos en la grifería.",
      "Revisa de vez en cuando el sellado de silicona alrededor del plato y el lavabo.",
      "Si notas goteos o humedad bajo un mueble, cierra la llave de paso y escríbenos.",
    ],
  },
  {
    id: "paredes",
    title: "Paredes pintadas y papel pintado",
    intro: "Para que tu pared luzca como el primer día durante años.",
    tips: [
      "Las primeras semanas tras pintar, evita frotar: la pintura sigue curando.",
      "Si la pintura es lavable, límpiala con esponja húmeda y jabón neutro, sin frotar fuerte.",
      "El papel pintado se limpia con un paño seco o apenas húmedo, según el tipo de papel.",
      "Guarda un poco de la pintura sobrante con su referencia para pequeños retoques.",
    ],
  },
  {
    id: "humedad",
    title: "Ventilación y humedad",
    intro: "Una casa bien ventilada conserva mejor todos sus acabados.",
    tips: [
      "Ventila unos minutos al día, también en invierno.",
      "Usa el extractor al cocinar y al ducharte.",
      "Vigila la condensación en ventanas y esquinas frías y sécala si aparece.",
    ],
  },
];
