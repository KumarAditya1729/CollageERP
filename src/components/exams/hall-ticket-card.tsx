import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/export";

export interface HallTicketExamLine {
  date: string | null;
  time: string | null;
  code: string;
  title: string;
  room: string | null;
  seat: string | null;
}

export interface HallTicketData {
  ticketNumber: string;
  verificationCode: string;
  studentName: string;
  rollNumber: string | null;
  admissionNumber: string | null;
  photoUrl: string | null;
  programName: string | null;
  sessionName: string;
  validUntil: string | null;
  isRevoked: boolean;
  exams: HallTicketExamLine[];
}

export interface HallTicketContext {
  collegeName: string;
  collegeLogo?: string | null;
  campusName?: string | null;
  verifyBaseUrl: string;
}

/** Printable hall ticket with QR verification link and Code128 barcode. */
export function HallTicketCard({
  ticket,
  context,
}: {
  ticket: HallTicketData;
  context: HallTicketContext;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const verifyUrl = `${context.verifyBaseUrl}?code=${ticket.verificationCode}`;

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(verifyUrl, { margin: 0, width: 160 })
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [verifyUrl]);

  useEffect(() => {
    if (!barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, ticket.ticketNumber, {
        format: "CODE128",
        displayValue: false,
        height: 34,
        margin: 0,
        lineColor: "#0f172a",
      });
    } catch {
      /* non Code128-safe characters simply leave the barcode blank */
    }
  }, [ticket.ticketNumber]);

  return (
    <div className="id-card w-full max-w-[640px] overflow-hidden rounded-xl border bg-card text-card-foreground">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
        {context.collegeLogo ? (
          <img src={context.collegeLogo} alt="" className="size-8 rounded" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
            {context.collegeName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{context.collegeName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {ticket.sessionName} · Hall ticket
          </p>
        </div>
        {ticket.isRevoked ? <Badge variant="destructive">Revoked</Badge> : null}
      </div>

      <div className="flex gap-4 px-4 py-4">
        {ticket.photoUrl ? (
          <img
            src={ticket.photoUrl}
            alt={ticket.studentName}
            className="size-20 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg border bg-muted text-lg font-semibold text-muted-foreground">
            {ticket.studentName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold">{ticket.studentName}</p>
          <p className="text-[11px] text-muted-foreground">
            {ticket.programName ?? "Programme not assigned"}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="outline" className="text-[10px]">
              {ticket.ticketNumber}
            </Badge>
            {ticket.rollNumber ? (
              <Badge variant="outline" className="text-[10px]">
                Roll {ticket.rollNumber}
              </Badge>
            ) : null}
            {ticket.admissionNumber ? (
              <Badge variant="outline" className="text-[10px]">
                {ticket.admissionNumber}
              </Badge>
            ) : null}
          </div>
        </div>
        {qr ? (
          <img src={qr} alt="Hall ticket verification QR" className="size-20 self-start" />
        ) : null}
      </div>

      <div className="border-t px-4 py-3">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1 font-medium">Date</th>
              <th className="pb-1 font-medium">Time</th>
              <th className="pb-1 font-medium">Subject</th>
              <th className="pb-1 font-medium">Room</th>
              <th className="pb-1 font-medium">Seat</th>
            </tr>
          </thead>
          <tbody>
            {ticket.exams.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-2 text-muted-foreground">
                  No scheduled papers for this student yet.
                </td>
              </tr>
            ) : (
              ticket.exams.map((line, index) => (
                <tr key={`${line.code}-${index}`} className="border-t">
                  <td className="py-1.5">{formatDate(line.date)}</td>
                  <td className="py-1.5">{line.time ?? "—"}</td>
                  <td className="py-1.5">
                    <span className="font-medium">{line.code}</span> · {line.title}
                  </td>
                  <td className="py-1.5">{line.room ?? "—"}</td>
                  <td className="py-1.5">{line.seat ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 border-t px-4 py-3">
        <svg ref={barcodeRef} className="h-9 w-full" role="img" aria-label="Hall ticket barcode" />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Verification code {ticket.verificationCode}</span>
          <span>Valid till {formatDate(ticket.validUntil)}</span>
        </div>
      </div>
    </div>
  );
}
