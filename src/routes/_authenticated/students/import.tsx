import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useStudentLookups, useStudentMutations } from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/export";
import { GENDERS, STUDENT_STATUSES, generateStudentNumbers } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/import")({
  head: () => ({
    meta: [
      { title: "Import students — CampusOS" },
      {
        name: "description",
        content:
          "Bulk import students from CSV or Excel with column mapping, validation and an error report.",
      },
      { property: "og:title", content: "Import students — CampusOS" },
      {
        property: "og:description",
        content: "Bulk student import with validation and error reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentImportPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Import unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

const TARGET_FIELDS = [
  { key: "admission_number", label: "Admission number" },
  { key: "registration_number", label: "Registration number" },
  { key: "roll_number", label: "Roll number" },
  { key: "first_name", label: "First name", required: true },
  { key: "middle_name", label: "Middle name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of birth (YYYY-MM-DD)" },
  { key: "status", label: "Status" },
  { key: "admission_date", label: "Admission date (YYYY-MM-DD)" },
  { key: "department", label: "Department name or code" },
  { key: "program", label: "Programme name or code" },
  { key: "guardian_name", label: "Guardian name" },
  { key: "guardian_phone", label: "Guardian phone" },
] as const;

const rowSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(120),
  last_name: z.string().trim().max(120).optional(),
  middle_name: z.string().trim().max(120).optional(),
  admission_number: z.string().trim().max(60).optional(),
  registration_number: z.string().trim().max(60).optional(),
  roll_number: z.string().trim().max(60).optional(),
  email: z.union([z.string().trim().email("Invalid email").max(255), z.literal("")]).optional(),
  phone: z.string().trim().max(30).optional(),
  gender: z.string().trim().optional(),
  date_of_birth: z.string().trim().optional(),
  status: z.string().trim().optional(),
  admission_date: z.string().trim().optional(),
  guardian_name: z.string().trim().max(160).optional(),
  guardian_phone: z.string().trim().max(30).optional(),
});

/** Minimal RFC4180 CSV parser — handles quoted cells, embedded commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

const NONE = "__skip";

function guessMapping(headers: string[]) {
  const mapping: Record<string, string> = {};
  for (const field of TARGET_FIELDS) {
    const match = headers.find(
      (header) =>
        header.toLowerCase().replace(/[^a-z]/g, "") === field.key.replace(/[^a-z]/g, "") ||
        header.toLowerCase().includes(field.key.split("_")[0]),
    );
    mapping[field.key] = match ?? NONE;
  }
  return mapping;
}

interface RowError {
  row: number;
  column: string | null;
  message: string;
}

function StudentImportPage() {
  const { tenant, campus, can } = useAccess();
  const { user } = useAuth();
  const lookups = useStudentLookups();
  const { createStudent } = useStudentMutations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canImport = can("student.manage");

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const preview = useMemo(() => rows.slice(0, 8), [rows]);

  const readFile = async (file: File) => {
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      toast.error(
        "Save the spreadsheet as CSV first — Excel workbooks are not read in the browser.",
      );
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      toast.error("That file has no rows.");
      return;
    }
    const [head, ...body] = parsed;
    setFileName(file.name);
    setHeaders(head);
    setRows(body);
    setMapping(guessMapping(head));
    setErrors([]);
    setResult(null);
  };

  const valueFor = (row: string[], key: string) => {
    const column = mapping[key];
    if (!column || column === NONE) return "";
    const index = headers.indexOf(column);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };

  const resolveLookup = (
    list: { id: string; name: string; code?: string | null }[] | undefined,
    raw: string,
  ) => {
    if (!raw) return null;
    const needle = raw.trim().toLowerCase();
    return (
      list?.find(
        (item) => item.name.toLowerCase() === needle || (item.code ?? "").toLowerCase() === needle,
      )?.id ?? null
    );
  };

  const runImport = async () => {
    if (!tenant) return;
    setRunning(true);
    setProgress(0);
    const collected: RowError[] = [];
    let success = 0;

    const { data: job, error: jobError } = await supabase
      .from("import_jobs")
      .insert({
        tenant_id: tenant.id,
        entity_type: "students",
        file_name: fileName,
        status: "processing",
        total_rows: rows.length,
        options: { mapping },
        started_at: new Date().toISOString(),
        created_by: user?.id ?? null,
      } as never)
      .select("id")
      .single();

    if (jobError) {
      setRunning(false);
      toast.error(jobError.message);
      return;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const raw = rows[index];
      const record = Object.fromEntries(
        TARGET_FIELDS.map((field) => [field.key, valueFor(raw, field.key)]),
      ) as Record<string, string>;

      const parsed = rowSchema.safeParse(record);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          collected.push({
            row: index + 2,
            column: String(issue.path[0] ?? ""),
            message: issue.message,
          });
        }
        setProgress(Math.round(((index + 1) / rows.length) * 100));
        continue;
      }

      const gender = GENDERS.includes(record.gender.toLowerCase() as never)
        ? record.gender.toLowerCase()
        : null;
      const status = STUDENT_STATUSES.includes(record.status.toLowerCase() as never)
        ? record.status.toLowerCase()
        : "applicant";

      try {
        const programId = resolveLookup(lookups.data?.programs, record.program);
        const programCode = lookups.data?.programs.find((p) => p.id === programId)?.code ?? null;
        const numbers = record.admission_number
          ? null
          : await generateStudentNumbers(tenant.id, { programCode });

        await createStudent.mutateAsync({
          admission_number: record.admission_number || numbers!.admission_number,
          registration_number: record.registration_number || null,
          roll_number: record.roll_number || null,
          first_name: record.first_name,
          middle_name: record.middle_name || null,
          last_name: record.last_name || null,
          email: record.email || null,
          phone: record.phone || null,
          gender,
          date_of_birth: record.date_of_birth || null,
          status,
          admission_date: record.admission_date || null,
          department_id: resolveLookup(lookups.data?.departments, record.department),
          program_id: programId,
          guardian_name: record.guardian_name || null,
          guardian_phone: record.guardian_phone || null,
          campus_id: campus?.id ?? null,
        });
        success += 1;
      } catch (error) {
        collected.push({ row: index + 2, column: null, message: (error as Error).message });
      }
      setProgress(Math.round(((index + 1) / rows.length) * 100));
    }

    if (collected.length) {
      await supabase.from("import_errors").insert(
        collected.slice(0, 500).map((item) => ({
          tenant_id: tenant.id,
          import_job_id: (job as { id: string }).id,
          row_number: item.row,
          column_name: item.column,
          message: item.message,
        })) as never,
      );
    }

    await supabase
      .from("import_jobs")
      .update({
        status: collected.length ? (success ? "partial" : "failed") : "completed",
        processed_rows: rows.length,
        success_rows: success,
        error_rows: collected.length,
        finished_at: new Date().toISOString(),
      } as never)
      .eq("id", (job as { id: string }).id);

    setErrors(collected);
    setResult({ success, failed: collected.length });
    setRunning(false);
    toast.success(`${success} of ${rows.length} rows imported`);
  };

  return (
    <>
      <PageHeader
        title="Import students"
        description="Map spreadsheet columns to student fields, validate every row, then write the register in one pass."
        crumbs={[{ label: "People" }, { label: "Students", to: "/students" }, { label: "Import" }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "campusos-student-import-template",
                  TARGET_FIELDS.map((field) => field.key),
                  [
                    [
                      "ADM2026001",
                      "2026CSE001",
                      "CSE26001",
                      "Aarav",
                      "",
                      "Sharma",
                      "aarav.sharma@example.edu",
                      "9876543210",
                      "male",
                      "2007-05-14",
                      "enrolled",
                      "2026-07-01",
                      "Computer Science",
                      "B.Tech Computer Science",
                      "Rohit Sharma",
                      "9876500000",
                    ],
                  ],
                )
              }
            >
              <Download className="size-4" />
              CSV template
            </Button>
            <Button variant="outline" asChild>
              <Link to="/students">Back to register</Link>
            </Button>
          </div>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">1 · Upload the file</CardTitle>
          <CardDescription>
            CSV up to a few thousand rows. Export Excel workbooks as CSV first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) void readFile(file);
            }}
          >
            <FileSpreadsheet className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{fileName ?? "Drop a CSV here"}</p>
            <p className="text-xs text-muted-foreground">
              {rows.length
                ? `${rows.length} data rows detected`
                : "or choose a file from your computer"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readFile(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={!canImport}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
            {!canImport ? (
              <p className="text-xs text-destructive">
                You do not have permission to import students.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {headers.length ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">2 · Map columns</CardTitle>
            <CardDescription>
              Unmapped fields are left empty; identifiers are generated when missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs">
                  {field.label}
                  {"required" in field && field.required ? (
                    <span className="ml-0.5 text-destructive">*</span>
                  ) : null}
                </Label>
                <Select
                  value={mapping[field.key] ?? NONE}
                  onValueChange={(value) => setMapping((prev) => ({ ...prev, [field.key]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not mapped</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {preview.length ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">3 · Preview</CardTitle>
            <CardDescription>First {preview.length} rows as they will be written.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {TARGET_FIELDS.map((field) => (
                      <TableHead key={field.key} className="whitespace-nowrap text-xs">
                        {field.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={index}>
                      {TARGET_FIELDS.map((field) => (
                        <TableCell key={field.key} className="whitespace-nowrap text-xs">
                          {valueFor(row, field.key) || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {running ? <Progress value={progress} /> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void runImport()} disabled={running || !canImport}>
                {running ? `Importing… ${progress}%` : `Import ${rows.length} rows`}
              </Button>
              {result ? (
                <div className="flex gap-2">
                  <Badge variant="secondary">{result.success} imported</Badge>
                  {result.failed ? (
                    <Badge variant="destructive">{result.failed} failed</Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {errors.length ? (
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm">Error report</CardTitle>
              <CardDescription>Saved against the import job for auditing.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  "student-import-errors",
                  ["Row", "Column", "Message"],
                  errors.map((item) => [item.row, item.column ?? "", item.message]),
                )
              }
            >
              <Download className="size-4" />
              Export errors
            </Button>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Column</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((item, index) => (
                  <TableRow key={`${item.row}-${index}`}>
                    <TableCell className="tabular-nums">{item.row}</TableCell>
                    <TableCell>{item.column ?? "—"}</TableCell>
                    <TableCell className="text-destructive">{item.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
