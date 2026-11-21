/**
 * CONFIGURACIÓN CENTRAL DE EXCELLENCE REFORMAS
 * ---------------------------------------------------------------------------
 * Edita este archivo para cambiar los datos públicos de la empresa.
 * Todo lo que hay aquí es PÚBLICO (se muestra en la web).
 *
 * ⚠️  Nunca pongas aquí contraseñas, claves API ni credenciales SMTP.
 *     Esos valores van en variables de entorno (ver `.env.example`).
 *
 * Los campos vacíos ("") se ocultan automáticamente en la web.
 */

export const siteConfig = {
  /** Nombre comercial. */
  name: "Excellence Reformas",
  /** Lema de marca. */
  tagline: "Tu casa también merece un Glow Up.",
  /** Persona que atiende las solicitudes. */
  owner: "Julio César",

  /**
   * Dominio público con protocolo, sin barra final.
   * Ejemplo: "https://excellencereformas.es"
   * Se usa para metadatos, sitemap y comprobación de origen del formulario.
   */
  domain: "",

  contact: {
    /** Teléfono visible en la web. Ejemplo: "+34 600 000 000". */
    phone: "",
    /**
     * Número de WhatsApp en formato internacional SOLO con dígitos
     * (sin "+", espacios ni guiones). Ejemplo: "34600000000".
     * Si está vacío, los botones de WhatsApp no se muestran.
     * También se puede definir sin tocar el código con la variable de entorno
     * NEXT_PUBLIC_WHATSAPP_NUMBER (por ejemplo, en Netlify) y volviendo a publicar.
     */
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    /** Email público de contacto. Ejemplo: "info@excellencereformas.es". */
    email: "",
  },

  /** Mensaje con el que se abre WhatsApp desde el botón flotante de la web. */
  whatsappMessage: "Hola Julio César, vengo de la web de Excellence Reformas y me gustaría hablar sobre una reforma.",

  /** Redes sociales. Las que estén vacías no se muestran. */
  social: {
    instagram: "https://www.instagram.com/excellencereformas.es/",
    instagramHandle: "@excellencereformas.es",
    facebook: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    /**
     * Enlace para dejar una reseña en Google (Perfil de Empresa de Google →
     * «Pedir reseñas» → copiar enlace). Si está vacío no se muestra.
     */
    googleReviews: "",
  },

  /**
   * Zona de actuación. Las localidades se sugieren al escribir en el
   * asistente. Una localidad fuera de esta lista NO se rechaza: la solicitud
   * se marca como «fuera de zona habitual» para que Julio César la valore.
   */
  serviceArea: {
    label: "Madrid y alrededores",
    provinces: ["Madrid"],
    localities: [
      "Madrid",
      "Alcobendas",
      "San Sebastián de los Reyes",
      "Tres Cantos",
      "Colmenar Viejo",
      "Algete",
      "Paracuellos de Jarama",
      "Las Rozas de Madrid",
      "Majadahonda",
      "Pozuelo de Alarcón",
      "Boadilla del Monte",
      "Villaviciosa de Odón",
      "Villanueva de la Cañada",
      "Villanueva del Pardillo",
      "Torrelodones",
      "Galapagar",
      "Collado Villalba",
      "Alcorcón",
      "Móstoles",
      "Fuenlabrada",
      "Leganés",
      "Getafe",
      "Parla",
      "Pinto",
      "Valdemoro",
      "Arroyomolinos",
      "Navalcarnero",
      "Rivas-Vaciamadrid",
      "Arganda del Rey",
      "Coslada",
      "San Fernando de Henares",
      "Torrejón de Ardoz",
      "Alcalá de Henares",
    ],
  },

  /**
   * Datos del responsable del tratamiento para la política de privacidad.
   * OBLIGATORIO completarlos antes de publicar la web.
   */
  legal: {
    holder: "", // Nombre y apellidos o razón social
    taxId: "", // NIF / CIF
    address: "", // Domicilio
    privacyEmail: "", // Email para ejercer derechos (si vacío, se usa contact.email)
    /** Meses que se conservan las solicitudes que no se convierten en encargo. */
    retentionMonths: 12,
    /** Cambia esta fecha cada vez que modifiques la política de privacidad. */
    privacyPolicyVersion: "2026-11-21",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** URL base para metadatos. */
export function getSiteUrl(): URL {
  const fromConfig = siteConfig.domain.trim();
  if (fromConfig) return new URL(fromConfig);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  // Netlify define URL (dirección principal del sitio) durante la compilación.
  const netlify = process.env.URL;
  if (netlify && /^https?:\/\//.test(netlify)) return new URL(netlify);
  return new URL("http://localhost:3000");
}

/** true si se conoce la dirección pública real (dominio o URL del hosting). */
export function hasPublicSiteUrl(): boolean {
  return getSiteUrl().hostname !== "localhost";
}

/** URL absoluta de una página de la web, o null si aún no hay dominio público. */
export function absoluteUrl(path: string): string | null {
  return hasPublicSiteUrl() ? new URL(path, getSiteUrl()).toString() : null;
}

export function hasWhatsApp(): boolean {
  return /^\d{8,15}$/.test(siteConfig.contact.whatsapp);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
