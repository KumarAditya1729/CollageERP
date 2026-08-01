import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/export";
import { initials, studentName, type StudentRecord } from "@/lib/students";

export interface IdCardContext {
  collegeName: string;
  collegeLogo?: string | null;
  campusName?: string | null;
  programName?: string | null;
  departmentName?: string | null;
  validUntil?: string | null;
}

/** Printable digital identity card with QR verification payload and Code128 barcode. */
export function StudentIdCard({
  student,
  context,
}: {
  student: StudentRecord;
  context: IdCardContext;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const payload = JSON.stringify({
    id: student.id,
    admission_number: student.admission_number,
    roll_number: student.roll_number,
    name: studentName(student),
    college: context.collegeName,
  });

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(payload, { margin: 0, width: 160 })
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [payload]);

  useEffect(() => {
    if (!barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, student.admission_number, {
        format: "CODE128",
        displayValue: false,
        height: 34,
        margin: 0,
        lineColor: "#0f172a",
      });
    } catch {
      /* invalid characters for Code128 — barcode simply stays blank */
    }
  }, [student.admission_number]);

  return (
    <div className="id-card w-[340px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-none">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        {context.collegeLogo ? (
          <img src={context.collegeLogo} alt="" className="size-7 rounded" />
        ) : (
          <div className="flex size-7 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
            {context.collegeName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{context.collegeName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {context.campusName ?? "Student identity card"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4">
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={studentName(student)}
            className="size-20 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg border bg-muted text-lg font-semibold text-muted-foreground">
            {initials(student)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold">{studentName(student)}</p>
          <p className="text-[11px] text-muted-foreground">
            {context.programName ?? "Programme not assigned"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {context.departmentName ?? "Department not assigned"}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="outline" className="text-[10px]">
              {student.admission_number}
            </Badge>
            {student.roll_number ? (
              <Badge variant="outline" className="text-[10px]">
                Roll {student.roll_number}
              </Badge>
            ) : null}
          </div>
        </div>

        {qr ? <img src={qr} alt="Verification QR code" className="size-16 self-start" /> : null}
      </div>

      <div className="space-y-2 border-t px-4 py-3">
        <svg
          ref={barcodeRef}
          className="h-9 w-full"
          role="img"
          aria-label="Admission number barcode"
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Blood group and emergency details on record</span>
          <span>Valid till {formatDate(context.validUntil)}</span>
        </div>
      </div>
    </div>
  );
}
