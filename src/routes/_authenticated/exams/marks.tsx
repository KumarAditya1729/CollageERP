import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Send, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import {
  MarksEntryGrid,
  type ExistingMark,
  type MarksCandidate,
} from "@/components/exams/marks-entry-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import {
  useExamRegistrations,
  useExams,
  useMarkWorkflow,
  useMarks,
  useSaveMarks,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv } from "@/lib/export";
import { labelize, markComponents, type MarkComponent } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/marks")({
  head: () => ({
    meta: [
      { title: "Marks entry & approval — CampusOS" },
      {
        name: "description",
        content:
          "Enter internal, external, lab, practical and project marks with grace, moderation, bulk paste and CSV import, then push them through approval.",
      },
      { property: "og:title", content: "Marks entry & approval — CampusOS" },
      {
        property: "og:description",
        content: "Spreadsheet-style marks capture with approval workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarksPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Marks unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function MarksPage() {
  const { can } = useAccess();
  const exams = useExams();
  const registrations = useExamRegistrations();
  const marks = useMarks();
  const students = useStudentRegister();
  const saveMarks = useSaveMarks();
  const workflow = useMarkWorkflow();

  const [examId, setExamId] = useState("");
  const [component, setComponent] = useState<MarkComponent>("external");
  const [importError, setImportError] = useState<string | null>(null);

  const canEnter = can("marks.enter") || can("exam.update");
  const canApprove = can("marks.approve") || can("exam.approve");

  const exam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const candidates = useMemo<MarksCandidate[]>(
    () =>
      (registrations.data ?? [])
        .filter((row) => row.exam_id === examId && ["eligible", "registered"].includes(row.status))
        .map((row) => {
          const student = studentById.get(row.student_id);
          return {
            studentId: row.student_id,
            name: student ? studentName(student) : "Unknown student",
            rollNumber: student?.roll_number ?? student?.admission_number ?? null,
            attendance: row.attendance_percentage,
            eligible: row.status !== "ineligible",
          };
        })
        .sort((a, b) => (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "")),
    [registrations.data, examId, studentById],
  );

  const sheet = useMemo(
    () => (marks.data ?? []).filter((row) => row.exam_id === examId && row.component === component),
    [marks.data, examId, component],
  );

  const existing = useMemo<ExistingMark[]>(
    () =>
      sheet.map((row) => ({
        studentId: row.student_id,
        marksObtained: row.marks_obtained,
        graceMarks: row.grace_marks,
        moderationDelta: row.moderation_delta,
        isAbsent: row.is_absent,
        isMalpractice: row.is_malpractice,
        remarks: row.remarks,
      })),
    [sheet],
  );

  const maxMarks = exam
    ? component === "external"
      ? Math.round((exam.max_marks * exam.external_weightage) / 100) || exam.max_marks
      : component === "internal"
        ? Math.round((exam.max_marks * exam.internal_weightage) / 100) || exam.max_marks
        : exam.max_marks
    : 100;

  const status = sheet[0]?.status ?? "draft";
  const entered = sheet.filter((row) => row.marks_obtained !== null || row.is_absent).length;
  const locked = ["approved", "published"].includes(status);

  /** Imports a `roll,marks` CSV straight into the sheet. */
  const importCsv = async (file: File) => {
    setImportError(null);
    const text = await file.text();
    const byRoll = new Map(
      candidates.map((row) => [(row.rollNumber ?? "").toLowerCase(), row.studentId]),
    );
    const entries: { studentId: string; marksObtained: number | null }[] = [];
    const unmatched: string[] = [];
    for (const line of text.split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue;
      const [roll, value] = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
      if (!roll) continue;
      const studentId = byRoll.get(roll.toLowerCase());
      if (!studentId) {
        unmatched.push(roll);
        continue;
      }
      const parsed = Number(value);
      entries.push({ studentId, marksObtained: Number.isFinite(parsed) ? parsed : null });
    }
    if (unmatched.length)
      setImportError(
        `${unmatched.length} roll number(s) did not match: ${unmatched.slice(0, 5).join(", ")}`,
      );
    if (!entries.length) return;
    await saveMarks.mutateAsync({
      examId,
      courseId: exam?.course_id ?? null,
      component,
      maxMarks,
      entries,
    });
  };

  return (
    <>
      <PageHeader
        title="Marks entry"
        description="Capture every assessment component with grace marks, moderation deltas and absentee flags, then move the sheet through approval."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Marks entry" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "marks-template",
                ["Roll", "Marks"],
                candidates.map((row) => [row.rollNumber, ""]),
              )
            }
            disabled={!candidates.length}
          >
            Download template
          </Button>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Select the sheet</CardTitle>
          <CardDescription>
            Each exam keeps one sheet per component, so internal and external marks stay separate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="marks-exam">Exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="marks-exam">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {(exams.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-48 gap-1.5">
            <Label htmlFor="marks-component">Component</Label>
            <Select
              value={component}
              onValueChange={(value) => setComponent(value as MarkComponent)}
            >
              <SelectTrigger id="marks-component">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {markComponents.map((row) => (
                  <SelectItem key={row} value={row}>
                    {labelize(row)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {exam && canEnter ? (
            <div className="grid gap-1.5">
              <Label htmlFor="marks-import">CSV import</Label>
              <Input
                id="marks-import"
                type="file"
                accept=".csv,text/csv"
                className="w-56"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importCsv(file);
                  event.target.value = "";
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {importError ? <p className="text-sm text-destructive">{importError}</p> : null}

      {exam ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Candidates" value={candidates.length} />
            <StatCard label="Entered" value={entered} />
            <StatCard label="Sheet status" value={labelize(status)} />
            <StatCard label="Maximum marks" value={maxMarks} hint={`Pass ${exam.passing_marks}`} />
          </div>

          <div className="flex flex-wrap gap-2">
            {canEnter ? (
              <Button
                variant="outline"
                onClick={() =>
                  workflow.mutate({ ids: sheet.map((row) => row.id), status: "submitted" })
                }
                disabled={!sheet.length || locked || workflow.isPending}
              >
                <Send className="size-4" />
                Submit for moderation
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    workflow.mutate({ ids: sheet.map((row) => row.id), status: "approved" })
                  }
                  disabled={!sheet.length || workflow.isPending}
                >
                  <CheckCircle2 className="size-4" />
                  Approve sheet
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    workflow.mutate({ ids: sheet.map((row) => row.id), status: "published" })
                  }
                  disabled={!sheet.length || workflow.isPending}
                >
                  <Upload className="size-4" />
                  Publish marks
                </Button>
              </>
            ) : null}
          </div>

          <MarksEntryGrid
            candidates={candidates}
            existing={existing}
            maxMarks={maxMarks}
            passingMarks={exam.passing_marks}
            readOnly={!canEnter || locked}
            saving={saveMarks.isPending}
            onSave={(entries) =>
              saveMarks.mutate({
                examId,
                courseId: exam.course_id,
                component,
                maxMarks,
                entries,
              })
            }
          />
        </>
      ) : (
        <EmptyState title="Select an exam" description="Pick a paper to open its marks sheet." />
      )}
    </>
  );
}
