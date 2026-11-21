import type { FormSubmittedEvent } from "@netlify/functions";
import { depsFromEnv, handleFormSubmission } from "../../src/lib/netlify/handle-submission";

/**
 * Se ejecuta automáticamente con cada envío VERIFICADO de Netlify Forms
 * (Netlify firma el evento: no se puede invocar desde fuera).
 * Envía el email visual a Excellence Reformas y la confirmación al cliente.
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
    const result = await handleFormSubmission(event.data, depsFromEnv((k) => Netlify.env.get(k)));
    console.log(`[formularios] ${result.form}: enviados ${result.sent.join(", ") || "ninguno"}${result.skipped ? ` (${result.skipped})` : ""}`);
  },
};

export default formularios;
