import type { BudgetRequest } from "@/lib/budget/schema";

export type StoredPhoto = { key: string; name: string; mime: string; size: number };

export type NotificationStatus = "pending" | "sent" | "preview" | "failed";

/** Solicitud tal como se guarda en el almacenamiento privado. */
export type StoredRequest = {
  schema: 1;
  id: string;
  reference: string;
  receivedAt: string; // ISO 8601 (UTC)
  receivedAtMadrid: string; // fecha legible en hora de Madrid
  source: "web/solicitar-presupuesto";
  zone: "habitual" | "fuera";
  idempotencyKey: string;
  fingerprint: string;
  request: BudgetRequest;
  photos: StoredPhoto[];
  notification: {
    status: NotificationStatus;
    attempts: number;
    lastAttemptAt?: string;
    messageId?: string;
    error?: string;
  };
};

export function recordKey(r: Pick<StoredRequest, "receivedAt" | "reference">, file = "solicitud.json") {
  const d = new Date(r.receivedAt);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `solicitudes/${yyyy}/${mm}/${r.reference}/${file}`;
}

export function formatMadrid(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export { makeReference } from "@/lib/budget/reference";
