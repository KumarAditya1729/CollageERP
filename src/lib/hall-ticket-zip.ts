import JSZip from "jszip";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

import type { HallTicketData } from "@/components/exams/hall-ticket-card";
import { formatDate } from "@/lib/export";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) =>
    character === "&"
      ? "&amp;"
      : character === "<"
        ? "&lt;"
        : character === ">"
          ? "&gt;"
          : character === '"'
            ? "&quot;"
            : "&#39;",
  );
}

function barcodeSvg(value: string) {
  if (typeof document === "undefined") return "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, value, {
      format: "CODE128",
      displayValue: false,
      height: 40,
      margin: 0,
      lineColor: "#0f172a",
    });
  } catch {
    return "";
  }
  return new XMLSerializer().serializeToString(svg);
}

/** Standalone, print-ready HTML for one hall ticket (no app CSS required). */
export async function hallTicketHtml(
  ticket: HallTicketData,
  context: { collegeName: string; verifyBaseUrl: string },
) {
  const verifyUrl = `${context.verifyBaseUrl}?code=${ticket.verificationCode}`;
  let qr = "";
  try {
    qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 160 });
  } catch {
    qr = "";
  }
  const rows = ticket.exams.length
    ? ticket.exams
        .map(
          (line) => `<tr>
        <td>${escapeHtml(formatDate(line.date))}</td>
        <td>${escapeHtml(line.time ?? "—")}</td>
        <td><strong>${escapeHtml(line.code)}</strong> · ${escapeHtml(line.title)}</td>
        <td>${escapeHtml(line.room ?? "—")}</td>
        <td>${escapeHtml(line.seat ?? "—")}</td>
      </tr>`,
        )
        .join("")
    : `<tr><td colspan="5">No scheduled papers.</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Hall ticket ${escapeHtml(ticket.ticketNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding:24px;color:#0f172a;background:#fff}
  .card{max-width:680px;margin:0 auto;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden}
  .head{display:flex;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
  .head h1{font-size:14px;margin:0}
  .head p{margin:2px 0 0;font-size:11px;color:#64748b}
  .body{display:flex;gap:16px;padding:16px}
  .body h2{font-size:14px;margin:0 0 4px}
  .meta{font-size:11px;color:#475569;margin:2px 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{text-align:left;color:#64748b;font-weight:500;padding:6px 4px;border-bottom:1px solid #e2e8f0}
  td{padding:6px 4px;border-bottom:1px solid #f1f5f9}
  .foot{padding:12px 16px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;display:flex;justify-content:space-between}
  .revoked{color:#b91c1c;font-weight:600}
  @media print{body{padding:0}.card{border:none}}
</style></head>
<body><div class="card">
  <div class="head">
    <div><h1>${escapeHtml(context.collegeName)}</h1><p>${escapeHtml(ticket.sessionName)} · Hall ticket</p></div>
    ${ticket.isRevoked ? '<span class="revoked">REVOKED</span>' : ""}
  </div>
  <div class="body">
    <div style="flex:1">
      <h2>${escapeHtml(ticket.studentName)}</h2>
      <p class="meta">${escapeHtml(ticket.programName ?? "Programme not assigned")}</p>
      <p class="meta">Ticket ${escapeHtml(ticket.ticketNumber)}${ticket.rollNumber ? ` · Roll ${escapeHtml(ticket.rollNumber)}` : ""}${ticket.admissionNumber ? ` · ${escapeHtml(ticket.admissionNumber)}` : ""}</p>
    </div>
    ${qr ? `<img src="${qr}" alt="Verification QR" width="120" height="120" />` : ""}
  </div>
  <div style="padding:0 16px 12px">
    <table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Room</th><th>Seat</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>
  <div style="padding:0 16px">${barcodeSvg(ticket.ticketNumber)}</div>
  <div class="foot"><span>Verification code ${escapeHtml(ticket.verificationCode)}</span><span>Valid till ${escapeHtml(formatDate(ticket.validUntil))}</span></div>
</div></body></html>`;
}

/** Bundles printable hall tickets into a single ZIP download. */
export async function downloadHallTicketsZip(
  tickets: HallTicketData[],
  context: { collegeName: string; verifyBaseUrl: string; fileName?: string },
) {
  const zip = new JSZip();
  const folder = zip.folder("hall-tickets") ?? zip;
  const index: string[] = ["Ticket number,Roll,Student,Verification code,Valid until"];
  for (const ticket of tickets) {
    const html = await hallTicketHtml(ticket, context);
    const safe = ticket.ticketNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    folder.file(`${safe}.html`, html);
    index.push(
      [
        ticket.ticketNumber,
        ticket.rollNumber ?? "",
        ticket.studentName,
        ticket.verificationCode,
        ticket.validUntil ?? "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
  }
  folder.file("register.csv", index.join("\n"));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${context.fileName ?? "hall-tickets"}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
