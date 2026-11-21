/**
 * Piezas visuales de los emails de Excellence Reformas.
 * HTML de tablas con estilos en línea: se ve bien en Gmail, Outlook y Apple Mail.
 */

export const C = {
  navy: "#102B49",
  navyDeep: "#0A1D33",
  steel: "#7292B0",
  steelInk: "#486684",
  steelSoft: "#A9BED3",
  mist: "#E9EEF3",
  mist50: "#F4F7FA",
  white: "#FFFFFF",
  amberBg: "#FFF7E8",
  amberInk: "#5C3B00",
  redBg: "#FDECEA",
  redInk: "#8A1C14",
  green: "#1FAF54",
};

const FONT = "Arial,Helvetica,sans-serif";

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Texto con saltos de línea respetados. */
export const escMultiline = (s: string) => esc(s).replace(/\n/g, "<br>");

export function shell({ preheader, label, body, footer }: { preheader: string; label: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Excellence Reformas</title></head>
<body style="margin:0;padding:0;background:${C.mist};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mist};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${C.white};border-radius:18px;overflow:hidden;">
    <tr><td style="background:${C.navy};padding:24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font:800 21px/1 ${FONT};letter-spacing:.06em;color:${C.white};">EXCELLENCE <span style="font-weight:400;color:${C.steelSoft};">REFORMAS</span></td>
        <td align="right" style="font:700 10px/1.3 ${FONT};letter-spacing:.18em;color:${C.steelSoft};text-transform:uppercase;">${esc(label)}</td>
      </tr></table>
    </td></tr>
    ${body}
    <tr><td style="padding:22px 28px 26px;background:${C.mist50};font:400 12px/1.6 ${FONT};color:${C.steelInk};">${footer}</td></tr>
  </table>
  <p style="margin:14px 0 0;font:400 11px/1.5 ${FONT};color:${C.steelInk};">Excellence Reformas · Tu casa también merece un Glow Up.</p>
</td></tr></table>
</body></html>`;
}

export function hero({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return `<tr><td style="padding:28px 28px 6px;">
    <div style="font:700 11px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${C.steelInk};">${kicker}</div>
    <h1 style="margin:8px 0 6px;font:800 25px/1.22 ${FONT};color:${C.navy};">${title}</h1>
    ${subtitle ? `<div style="font:400 14px/1.5 ${FONT};color:${C.steelInk};">${subtitle}</div>` : ""}
  </td></tr>`;
}

export function button(href: string, label: string, kind: "primary" | "soft" | "whatsapp" = "primary") {
  const style =
    kind === "primary"
      ? `background:${C.navy};color:${C.white};`
      : kind === "whatsapp"
        ? `background:${C.green};color:${C.white};`
        : `background:${C.mist};color:${C.navy};`;
  return `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 20px;border-radius:999px;font:700 14px/1 ${FONT};text-decoration:none;${style}">${esc(label)}</a>`;
}

export function buttons(items: string[]) {
  const html = items.filter(Boolean).join("");
  return html ? `<tr><td style="padding:16px 28px 4px;">${html}</td></tr>` : "";
}

/** Rejilla de datos clave (2 columnas). */
export function tiles(items: { label: string; value: string; tone?: "warn" | "alert" }[]) {
  const cells = items.map((t) => {
    const bg = t.tone === "warn" ? C.amberBg : t.tone === "alert" ? C.redBg : C.mist50;
    const ink = t.tone === "warn" ? C.amberInk : t.tone === "alert" ? C.redInk : C.navy;
    return `<td width="50%" valign="top" style="padding:6px;">
      <div style="background:${bg};border-radius:12px;padding:13px 14px;">
        <div style="font:700 10px/1.3 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${C.steelInk};">${esc(t.label)}</div>
        <div style="margin-top:5px;font:700 15px/1.35 ${FONT};color:${ink};">${esc(t.value)}</div>
      </div></td>`;
  });
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  return `<tr><td style="padding:14px 22px 2px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table></td></tr>`;
}

export function section(title: string, inner: string) {
  return `<tr><td style="padding:22px 28px 4px;font:700 11px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${C.steelInk};">${esc(title)}</td></tr>
  <tr><td style="padding:0 28px;">${inner}</td></tr>`;
}

export function rows(items: { label: string; value: string }[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${items
    .map(
      (r) => `<tr>
      <td style="padding:9px 12px 9px 0;border-bottom:1px solid ${C.mist};font:400 14px/1.5 ${FONT};color:${C.steelInk};width:38%;vertical-align:top;">${esc(r.label)}</td>
      <td style="padding:9px 0;border-bottom:1px solid ${C.mist};font:700 14px/1.5 ${FONT};color:${C.navy};vertical-align:top;">${escMultiline(r.value)}</td>
    </tr>`,
    )
    .join("")}</table>`;
}

export function note(text: string, tone: "info" | "warn" | "alert" = "info") {
  const bg = tone === "warn" ? C.amberBg : tone === "alert" ? C.redBg : C.mist50;
  const ink = tone === "warn" ? C.amberInk : tone === "alert" ? C.redInk : C.steelInk;
  return `<p style="margin:10px 0 0;padding:12px 14px;border-radius:10px;background:${bg};font:400 13px/1.55 ${FONT};color:${ink};">${escMultiline(text)}</p>`;
}

export function quote(text: string) {
  return `<div style="margin-top:4px;padding:14px 16px;border-left:4px solid ${C.steel};background:${C.mist50};border-radius:0 12px 12px 0;font:400 15px/1.6 ${FONT};color:${C.navy};">${escMultiline(text)}</div>`;
}

/** Fotos incrustadas (cid) en una rejilla de dos columnas. */
export function photoGrid(cids: string[]) {
  if (!cids.length) return "";
  const cells = cids.map(
    (cid, i) =>
      `<td width="50%" valign="top" style="padding:6px;"><img src="cid:${cid}" alt="Foto ${i + 1}" width="268" style="display:block;width:100%;max-width:268px;height:auto;border-radius:12px;border:0;"></td>`,
  );
  const rowsHtml: string[] = [];
  for (let i = 0; i < cells.length; i += 2) rowsHtml.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml.join("")}</table>`;
}

export function stars(rating: number) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return `<span style="font:400 26px/1 ${FONT};letter-spacing:2px;color:#F2B01E;">${"★".repeat(r)}</span><span style="font:400 26px/1 ${FONT};letter-spacing:2px;color:${C.mist};">${"★".repeat(5 - r)}</span>`;
}

export function paragraph(html: string) {
  return `<tr><td style="padding:10px 28px 0;font:400 15px/1.65 ${FONT};color:${C.navy};">${html}</td></tr>`;
}

export function steps(items: { title: string; text: string }[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
    .map(
      (s, i) => `<tr><td width="40" valign="top" style="padding:8px 0;">
        <div style="width:30px;height:30px;border-radius:50%;background:${C.navy};color:${C.white};font:700 14px/30px ${FONT};text-align:center;">${i + 1}</div></td>
        <td valign="top" style="padding:8px 0;"><div style="font:700 15px/1.4 ${FONT};color:${C.navy};">${esc(s.title)}</div>
        <div style="font:400 14px/1.55 ${FONT};color:${C.steelInk};">${esc(s.text)}</div></td></tr>`,
    )
    .join("")}</table>`;
}
