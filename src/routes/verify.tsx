import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/export";
import { labelize } from "@/lib/exams";

interface VerificationResult {
  status: "valid" | "revoked" | "expired" | "not_found" | "invalid" | "error";
  documentType?: string;
  number?: string;
  holder?: string | null;
  rollNumber?: string | null;
  session?: string | null;
  issuedOn?: string | null;
  validUntil?: string | null;
  reason?: string;
}

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? search["code"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify a document — CampusOS" },
      {
        name: "description",
        content:
          "Check the authenticity of a CampusOS hall ticket, marksheet, grade card or transcript using its QR code or verification code.",
      },
      { property: "og:title", content: "Verify a document — CampusOS" },
      {
        property: "og:description",
        content: "Instant authenticity check for examination documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = useSearch({ from: "/verify" });
  const [code, setCode] = useState(search.code ?? "");

  const verify = useMutation<VerificationResult, Error, string>({
    mutationFn: async (value) => {
      const response = await fetch(`/api/public/verify?code=${encodeURIComponent(value.trim())}`);
      return (await response.json()) as VerificationResult;
    },
  });

  useEffect(() => {
    if (search.code && search.code.length >= 6) verify.mutate(search.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.code]);

  const result = verify.data;
  const tone =
    result?.status === "valid"
      ? { icon: BadgeCheck, label: "Genuine document", variant: "secondary" as const }
      : result?.status === "revoked"
        ? { icon: ShieldX, label: "Revoked", variant: "destructive" as const }
        : result?.status === "expired"
          ? { icon: ShieldAlert, label: "Expired", variant: "outline" as const }
          : { icon: ShieldX, label: "Not found", variant: "destructive" as const };
  const ToneIcon = tone.icon;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Document verification</h1>
        <p className="text-sm text-muted-foreground">
          Scan the QR code on a hall ticket, marksheet, grade card, transcript or provisional
          certificate, or type the verification code printed on it.
        </p>
      </header>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Verification code</CardTitle>
          <CardDescription>Codes are 8 to 12 characters and are case-insensitive.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (code.trim().length >= 6) verify.mutate(code);
            }}
          >
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="verify-code">Code</Label>
              <Input
                id="verify-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="e.g. 8FJ2K4M1"
                maxLength={32}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={verify.isPending || code.trim().length < 6}>
              {verify.isPending ? "Checking…" : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex items-center gap-2">
              <ToneIcon className="size-5" />
              <CardTitle className="text-base">{tone.label}</CardTitle>
            </div>
            <Badge variant={tone.variant}>{labelize(result.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {result.status === "not_found" ||
            result.status === "invalid" ||
            result.status === "error" ? (
              <p className="text-muted-foreground">
                {result.reason ??
                  "No document matches this code. Check the code and try again, or contact the examination office."}
              </p>
            ) : (
              <dl className="grid gap-2 sm:grid-cols-2">
                <Field label="Document" value={labelize(result.documentType ?? "")} />
                <Field label="Number" value={result.number ?? "—"} />
                <Field label="Holder" value={result.holder ?? "—"} />
                <Field label="Roll number" value={result.rollNumber ?? "—"} />
                <Field label="Session" value={result.session ?? "—"} />
                <Field label="Issued on" value={formatDate(result.issuedOn)} />
                {result.validUntil ? (
                  <Field label="Valid until" value={formatDate(result.validUntil)} />
                ) : null}
              </dl>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
