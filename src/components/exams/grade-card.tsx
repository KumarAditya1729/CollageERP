import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/export";

export interface GradeCardLine {
  code: string;
  title: string;
  credits: number;
  internal: number;
  external: number;
  total: number;
  max: number;
  grade: string | null;
  gradePoint: number | null;
  isPass: boolean;
}

export interface GradeCardData {
  certificateNumber?: string | null;
  verificationCode?: string | null;
  kindLabel: string;
  studentName: string;
  rollNumber: string | null;
  programName: string | null;
  sessionName: string;
  issuedOn?: string | null;
  sgpa: number | null;
  cgpa: number | null;
  creditsEarned: number;
  creditsRegistered: number;
  percentage: number | null;
  classAwarded: string | null;
  rank: number | null;
  backlogs: number;
  isPass: boolean;
  lines: GradeCardLine[];
  signatory?: string | null;
}

/** Printable grade card / marksheet / transcript with verification QR. */
export function GradeCard({
  data,
  collegeName,
  verifyBaseUrl,
}: {
  data: GradeCardData;
  collegeName: string;
  verifyBaseUrl: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const code = data.verificationCode;

  useEffect(() => {
    if (!code) {
      setQr(null);
      return;
    }
    let active = true;
    void QRCode.toDataURL(`${verifyBaseUrl}?code=${code}`, { margin: 0, width: 160 })
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [code, verifyBaseUrl]);

  return (
    <div className="id-card w-full overflow-hidden rounded-xl border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-3 border-b bg-muted/40 px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{collegeName}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {data.kindLabel} · {data.sessionName}
          </p>
        </div>
        {qr ? <img src={qr} alt="Verification QR" className="size-16" /> : null}
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
        <Field label="Student" value={data.studentName} />
        <Field label="Roll number" value={data.rollNumber ?? "—"} />
        <Field label="Programme" value={data.programName ?? "—"} />
        <Field label="Issued on" value={formatDate(data.issuedOn)} />
      </div>

      <div className="px-5 pb-4">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1 font-medium">Subject</th>
              <th className="pb-1 text-right font-medium">Credits</th>
              <th className="pb-1 text-right font-medium">Internal</th>
              <th className="pb-1 text-right font-medium">External</th>
              <th className="pb-1 text-right font-medium">Total</th>
              <th className="pb-1 text-right font-medium">Grade</th>
              <th className="pb-1 text-right font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, index) => (
              <tr key={`${line.code}-${index}`} className="border-t">
                <td className="py-1.5">
                  <span className="font-medium">{line.code}</span> · {line.title}
                </td>
                <td className="py-1.5 text-right tabular-nums">{line.credits}</td>
                <td className="py-1.5 text-right tabular-nums">{line.internal}</td>
                <td className="py-1.5 text-right tabular-nums">{line.external}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {line.total}/{line.max}
                </td>
                <td className="py-1.5 text-right">
                  <Badge
                    variant={line.isPass ? "secondary" : "destructive"}
                    className="text-[10px]"
                  >
                    {line.grade ?? "—"}
                  </Badge>
                </td>
                <td className="py-1.5 text-right tabular-nums">{line.gradePoint ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t px-5 py-4 sm:grid-cols-4">
        <Field label="SGPA" value={data.sgpa?.toFixed(2) ?? "—"} />
        <Field label="CGPA" value={data.cgpa?.toFixed(2) ?? "—"} />
        <Field label="Credits" value={`${data.creditsEarned}/${data.creditsRegistered}`} />
        <Field label="Percentage" value={data.percentage !== null ? `${data.percentage}%` : "—"} />
        <Field label="Result" value={data.isPass ? "Pass" : "Fail"} />
        <Field label="Class" value={data.classAwarded ?? "—"} />
        <Field label="Rank" value={data.rank ? `#${data.rank}` : "—"} />
        <Field label="Backlogs" value={String(data.backlogs)} />
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3 text-[10px] text-muted-foreground">
        <span>
          {data.certificateNumber
            ? `Certificate ${data.certificateNumber} · verify with ${data.verificationCode}`
            : "Provisional statement — not a certificate"}
        </span>
        <span>{data.signatory ?? "Controller of Examinations"}</span>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
