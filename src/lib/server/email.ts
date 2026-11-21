import nodemailer from "nodemailer";
import { siteConfig } from "@/config/site";
import { normalizePhone } from "@/lib/budget/schema";
import { clientWhatsAppUrl } from "@/lib/budget/whatsapp";

export { clientWhatsAppUrl };
import {
  budgetText,
  detailRows,
  locationText,
  propertyText,
  reformTitle,
  timingText,
  type SummaryRow,
} from "@/lib/budget/summary";
import type { EmailConfig } from "./env";
import type { StoredRequest } from "./record";

export type Attachment = { filename: string; content: Uint8Array; contentType: string };

export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments: Attachment[];
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildNotificationEmail(record: StoredRequest, photos: Attachment[]): EmailMessage {
  const r = record.request;
  const title = reformTitle(r);
  const locality = r.location.locality;
  const subject = `Nueva solicitud de presupuesto · ${title} · ${locality} · ${record.reference}`;

  const sections: { title: string; rows: SummaryRow[]; note?: string }[] = [
    {
      title: "Proyecto",
      rows: [
        { label: "Tipo de reforma", value: title },
        { label: "Inmueble", value: propertyText(r) },
        ...detailRows(r),
      ],
    },
    {
      title: "Ubicación",
      rows: [{ label: "Localidad", value: locationText(r) }],
      note:
        record.zone === "fuera"
          ? `Localidad fuera de la zona habitual (${siteConfig.serviceArea.label}). Valorar si se atiende.`
          : undefined,
    },
    {
      title: "Plazos y presupuesto",
      rows: [
        { label: "Fecha prevista", value: timingText(r) },
        { label: "Presupuesto orientativo", value: budgetText(r) },
      ],
      note: "El rango de presupuesto lo indica el cliente como referencia de sus expectativas; no es un precio.",
    },
    { title: "Descripción del cliente", rows: [{ label: "Descripción", value: r.description || "Sin descripción" }] },
    {
      title: "Contacto",
      rows: [
        { label: "Nombre", value: r.contact.name },
        { label: "Teléfono", value: r.contact.phone },
        { label: "Email", value: r.contact.email },
      ],
    },
  ];

  const tel = `tel:${normalizePhone(r.contact.phone)}`;
  const wa = clientWhatsAppUrl(r.contact.phone);
  const mail = `mailto:${r.contact.email}?subject=${encodeURIComponent(`Tu solicitud ${record.reference} · ${siteConfig.name}`)}`;

  const button = (href: string, label: string, primary = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:999px;font:600 14px/1 Arial,Helvetica,sans-serif;text-decoration:none;${
      primary ? "background:#102B49;color:#ffffff;" : "background:#E9EEF3;color:#102B49;"
    }">${esc(label)}</a>`;

  const sectionHtml = sections
    .map(
      (s) => `
      <tr><td style="padding:22px 28px 6px;font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#486684;">${esc(s.title)}</td></tr>
      <tr><td style="padding:0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${s.rows
            .map(
              (row) => `<tr>
                <td style="padding:9px 12px 9px 0;border-bottom:1px solid #E9EEF3;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#486684;width:38%;vertical-align:top;">${esc(row.label)}</td>
                <td style="padding:9px 0;border-bottom:1px solid #E9EEF3;font:600 14px/1.5 Arial,Helvetica,sans-serif;color:#102B49;vertical-align:top;white-space:pre-wrap;">${esc(row.value)}</td>
              </tr>`,
            )
            .join("")}
        </table>
        ${s.note ? `<p style="margin:10px 0 0;padding:10px 12px;border-radius:8px;background:#F4F7FA;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#486684;">${esc(s.note)}</p>` : ""}
      </td></tr>`,
    )
    .join("");

  const photoList = photos.length
    ? `${photos.length} ${photos.length === 1 ? "fotografía adjunta" : "fotografías adjuntas"} a este email.`
    : "El cliente no ha adjuntado fotografías.";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#E9EEF3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#102B49;padding:22px 28px;">
      <div style="font:800 20px/1 Arial,Helvetica,sans-serif;letter-spacing:.06em;color:#ffffff;">EXCELLENCE <span style="font-weight:400;color:#A9BED3;">REFORMAS</span></div>
      <div style="margin-top:6px;font:600 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.18em;color:#A9BED3;">SMART BUDGET</div>
    </td></tr>
    <tr><td style="padding:26px 28px 4px;">
      <div style="font:400 13px/1.4 Arial,Helvetica,sans-serif;color:#486684;">Nueva solicitud de presupuesto · Ref. <strong style="color:#102B49;">${esc(record.reference)}</strong></div>
      <h1 style="margin:8px 0 4px;font:800 24px/1.25 Arial,Helvetica,sans-serif;color:#102B49;">${esc(title)} en ${esc(locality)}</h1>
      <div style="font:400 13px/1.4 Arial,Helvetica,sans-serif;color:#486684;">Recibida el ${esc(record.receivedAtMadrid)}</div>
    </td></tr>
    <tr><td style="padding:18px 28px 4px;">
      ${button(tel, `Llamar a ${r.contact.name.split(" ")[0]}`, true)}
      ${wa ? button(wa, "Abrir WhatsApp") : ""}
      ${button(mail, "Responder por email")}
    </td></tr>
    ${sectionHtml}
    <tr><td style="padding:22px 28px 6px;font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#486684;">Fotografías</td></tr>
    <tr><td style="padding:0 28px;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#102B49;">${esc(photoList)}</td></tr>
    <tr><td style="padding:26px 28px 28px;">
      <p style="margin:0;padding-top:16px;border-top:1px solid #E9EEF3;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#486684;">
        El cliente aceptó la política de privacidad (versión ${esc(r.consent.policyVersion)}) al enviar la solicitud.
        Solicitud guardada con el identificador ${esc(record.id)}.
      </p>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `NUEVA SOLICITUD DE PRESUPUESTO · ${record.reference}`,
    `Recibida el ${record.receivedAtMadrid}`,
    "",
    ...sections.flatMap((s) => [
      s.title.toUpperCase(),
      ...s.rows.map((row) => `- ${row.label}: ${row.value}`),
      ...(s.note ? [`  (${s.note})`] : []),
      "",
    ]),
    `FOTOGRAFÍAS: ${photoList}`,
    "",
    `Llamar: ${normalizePhone(r.contact.phone)}`,
    ...(wa ? [`WhatsApp: ${wa}`] : []),
    `Email: ${r.contact.email}`,
  ].join("\n");

  return { subject, html, text, replyTo: r.contact.email, attachments: photos };
}

export type SendResult = { status: "sent"; messageId: string } | { status: "preview" };

export async function sendNotification(cfg: EmailConfig, message: EmailMessage): Promise<SendResult> {
  if (cfg.mode === "preview") return { status: "preview" };
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
    to: cfg.to,
    replyTo: message.replyTo,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: message.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
      contentType: a.contentType,
    })),
  });
  return { status: "sent", messageId: String(info.messageId ?? "") };
}
