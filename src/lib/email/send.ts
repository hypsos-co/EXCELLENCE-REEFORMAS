import nodemailer from "nodemailer";
import type { EmailMessage } from "./templates";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

/** Envía un email por SMTP (las fotos con `cid` se muestran dentro del email). */
export async function sendMail(cfg: SmtpConfig, message: EmailMessage, to: string[]): Promise<string> {
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  const info = await transport.sendMail({
    from: cfg.from,
    to,
    replyTo: message.replyTo,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: message.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
      contentType: a.contentType,
      cid: a.cid,
    })),
  });
  return String(info.messageId ?? "");
}
