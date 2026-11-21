import type { FormSubmittedEvent } from "@netlify/functions";
import { depsFromEnv, handleFormSubmission } from "../../src/lib/netlify/handle-submission";
import { netlifyReviewStore } from "../../src/lib/netlify/reviews-store";

/**
 * Se ejecuta automáticamente con cada envío VERIFICADO de Netlify Forms
 * (Netlify firma el evento: no se puede invocar desde fuera).
 * Envía el email visual a Excellence Reformas y la confirmación al cliente, y
 * guarda en Netlify Blobs las valoraciones que el cliente autoriza a publicar.
 *
 * Variables de entorno (Netlify → Project configuration → Environment variables,
 * con el ámbito «Functions»): SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER,
 * SMTP_PASS, MAIL_FROM, NOTIFY_EMAIL_TO y, opcional, SEND_CLIENT_CONFIRMATION=false.
 *
 * Importante: las funciones solo se publican si el proyecto se despliega desde
 * Git o con Netlify CLI (no al arrastrar la carpeta `out/`).
 */
const formularios = {
  async formSubmitted(event: FormSubmittedEvent) {
    const get = (k: string) => Netlify.env.get(k);
    const result = await handleFormSubmission(event.data, {
      ...depsFromEnv(get),
      reviews: { store: netlifyReviewStore(), siteUrl: get("URL") },
    });
    console.log(
      `[formularios] ${result.form}: enviados ${result.sent.join(", ") || "ninguno"}${result.skipped ? ` (${result.skipped})` : ""}${result.published ? " · opinión publicada" : ""}`,
    );
  },
};

export default formularios;
