import { buildBudgetNotification, type Attachment, type EmailMessage } from "@/lib/email/templates";
import { sendMail } from "@/lib/email/send";
import { clientWhatsAppUrl } from "@/lib/budget/whatsapp";
import type { EmailConfig } from "./env";
import type { StoredRequest } from "./record";

export { clientWhatsAppUrl };
export type { Attachment, EmailMessage };

/** Email visual para Excellence Reformas con los datos de la solicitud y las fotos. */
export function buildNotificationEmail(record: StoredRequest, photos: Attachment[]): EmailMessage {
  return buildBudgetNotification(record, photos);
}

export type SendResult = { status: "sent"; messageId: string } | { status: "preview" };

export async function sendNotification(cfg: EmailConfig, message: EmailMessage, to?: string[]): Promise<SendResult> {
  if (cfg.mode === "preview") return { status: "preview" };
  const messageId = await sendMail(cfg, message, to ?? cfg.to);
  return { status: "sent", messageId };
}
