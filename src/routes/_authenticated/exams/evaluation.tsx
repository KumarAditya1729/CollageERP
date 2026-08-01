import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, Scale, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/hooks/useAccess";
import { facultyName, useAcademicLookups } from "@/hooks/useAcademics";
import {
  useExams,
  useMarkAdjustments,
  useMarkEvaluations,
  useMarks,
  useRecordEvaluation,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv } from "@/lib/export";
import { evaluationKinds, labelize, optionsOf, round2, statusTone } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation & moderation — CampusOS" },
      {
        name: "description",
        content:
          "Run single, double and blind evaluation on anonymous scripts, then apply moderation, grace marks, scaling and normalisation.",
      },
      { property: "og:title", content: "Evaluation & moderation — CampusOS" },
      { property: "og:description", content: "Script evaluation with moderation controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EvaluationPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Evaluation unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface ScriptRow extends Record<string, unknown> {
  id: string;
  scriptCode: string;
  identity: string;
  marks: number | null;
  grace: number;
  moderation: number;
  final: number;
  status: string;
  rounds: number;
  variance: number | null;
}

function EvaluationPage() {
  const { can } = useAccess();
  const exams = useExams();
  const marks = useMarks();
  const evaluations = useMarkEvaluations();
  const students = useStudentRegister();
  const lookups = useAcademicLookups();
  const record = useRecordEvaluation();
  const adjust = useMarkAdjustments();

  const [examId, setExamId] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [evalOpen, setEvalOpen] = useState<string | null>(null);
  const [graceLimit, setGraceLimit] = useState("5");
  const [scaleFactor, setScaleFactor] = useState("1.05");
  const [targetMean, setTargetMean] = useState("50");

  const canEvaluate = can("marks.enter") || can("exam.update");
  const canModerate = can("marks.approve") || can("exam.approve");
  const exam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const sheet = useMemo(
    () => (marks.data ?? []).filter((row) => row.exam_id === examId),
    [marks.data, examId],
  );

  const rows = useMemo<ScriptRow[]>(
    () =>
      sheet.map((row, index) => {
        const student = studentById.get(row.student_id);
        const rounds = (evaluations.data ?? []).filter((item) => item.mark_id === row.id);
        const awarded = rounds
          .map((item) => item.marks_awarded)
          .filter((value): value is number => value !== null);
        const variance =
          awarded.length > 1 ? round2(Math.max(...awarded) - Math.min(...awarded)) : null;
        return {
          id: row.id,
          scriptCode: `SCR-${String(index + 1).padStart(4, "0")}`,
          identity: anonymous
            ? "Anonymous script"
            : `${student?.roll_number ?? student?.admission_number ?? "—"} · ${student ? studentName(student) : "Unknown"}`,
          marks: row.marks_obtained,
          grace: row.grace_marks,
          moderation: row.moderation_delta,
          final: row.final_marks,
          status: row.status,
          rounds: rounds.length,
          variance,
        } satisfies ScriptRow;
      }),
    [sheet, studentById, evaluations.data, anonymous],
  );

  const evaluated = rows.filter((row) => row.rounds > 0).length;
  const discrepancies = rows.filter(
    (row) => (row.variance ?? 0) > (exam ? exam.max_marks * 0.1 : 10),
  ).length;
  const mean = rows.length
    ? round2(rows.reduce((sum, row) => sum + (row.marks ?? 0), 0) / rows.length)
    : 0;

  const applyGrace = () => {
    const limit = Number(graceLimit);
    if (!exam || !Number.isFinite(limit)) return;
    const targets = sheet
      .filter((row) => {
        const value = row.marks_obtained ?? 0;
        return !row.is_absent && value < exam.passing_marks && exam.passing_marks - value <= limit;
      })
      .map((row) => ({ id: row.id, graceMarks: exam.passing_marks - (row.marks_obtained ?? 0) }));
    if (targets.length) adjust.mutate({ rows: targets });
  };

  const applyScaling = () => {
    const factor = Number(scaleFactor);
    if (!exam || !Number.isFinite(factor)) return;
    const targets = sheet
      .filter((row) => !row.is_absent && row.marks_obtained !== null)
      .map((row) => {
        const base = row.marks_obtained ?? 0;
        const scaled = Math.min(exam.max_marks, Math.round(base * factor));
        return { id: row.id, moderationDelta: scaled - base };
      })
      .filter((row) => row.moderationDelta !== 0);
    if (targets.length) adjust.mutate({ rows: targets });
  };

  const applyNormalisation = () => {
    const target = Number(targetMean);
    if (!exam || !Number.isFinite(target) || !rows.length) return;
    const shift = Math.round(target - mean);
    if (!shift) return;
    const targets = sheet
      .filter((row) => !row.is_absent && row.marks_obtained !== null)
      .map((row) => {
        const base = row.marks_obtained ?? 0;
        const next = Math.max(0, Math.min(exam.max_marks, base + shift));
        return { id: row.id, moderationDelta: next - base };
      });
    if (targets.length) adjust.mutate({ rows: targets });
  };

  return (
    <>
      <PageHeader
        title="Evaluation & moderation"
        description="Scripts stay anonymous by default. Record single, double or blind evaluation rounds, then moderate with grace, scaling or normalisation."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Evaluation" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "evaluation-sheet",
                [
                  "Script",
                  "Candidate",
                  "Marks",
                  "Grace",
                  "Moderation",
                  "Final",
                  "Rounds",
                  "Variance",
                ],
                rows.map((row) => [
                  row.scriptCode,
                  row.identity,
                  row.marks,
                  row.grace,
                  row.moderation,
                  row.final,
                  row.rounds,
                  row.variance,
                ]),
              )
            }
            disabled={!rows.length}
          >
            Export
          </Button>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Evaluation sheet</CardTitle>
          <CardDescription>Identities stay hidden until moderation is complete.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="eval-exam">Exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="eval-exam">
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
          <div className="flex items-center gap-2 pb-2">
            <Switch id="eval-anon" checked={anonymous} onCheckedChange={setAnonymous} />
            <Label htmlFor="eval-anon" className="flex items-center gap-1.5">
              <EyeOff className="size-4" /> Anonymous scripts
            </Label>
          </div>
        </CardContent>
      </Card>

      {exam ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Scripts" value={rows.length} />
            <StatCard label="Evaluated" value={evaluated} />
            <StatCard label="Mean marks" value={mean} />
            <StatCard
              label="Discrepancies"
              value={discrepancies}
              hint="Double-evaluation variance above 10%"
            />
          </div>

          {canModerate ? (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Moderation tools</CardTitle>
                <CardDescription>
                  Adjustments are stored as grace marks or moderation deltas and are fully
                  auditable.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="grace-limit">Grace marks (up to)</Label>
                  <Input
                    id="grace-limit"
                    type="number"
                    value={graceLimit}
                    onChange={(event) => setGraceLimit(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyGrace}
                    disabled={adjust.isPending}
                  >
                    <Sparkles className="size-4" />
                    Apply grace
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-factor">Scaling factor</Label>
                  <Input
                    id="scale-factor"
                    type="number"
                    step="0.01"
                    value={scaleFactor}
                    onChange={(event) => setScaleFactor(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyScaling}
                    disabled={adjust.isPending}
                  >
                    <Scale className="size-4" />
                    Apply scaling
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-mean">Normalise to mean</Label>
                  <Input
                    id="target-mean"
                    type="number"
                    value={targetMean}
                    onChange={(event) => setTargetMean(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyNormalisation}
                    disabled={adjust.isPending}
                  >
                    <Wand2 className="size-4" />
                    Normalise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <DataTable<ScriptRow>
            rows={rows}
            loading={marks.isLoading}
            storageKey="exam-evaluation"
            exportName="evaluation"
            getRowId={(row) => row.id}
            columns={[
              { key: "script", header: "Script", value: (row) => row.scriptCode, sortable: true },
              { key: "identity", header: "Candidate", value: (row) => row.identity },
              { key: "marks", header: "Marks", value: (row) => row.marks ?? "—", sortable: true },
              { key: "grace", header: "Grace", value: (row) => row.grace },
              { key: "moderation", header: "Moderation", value: (row) => row.moderation },
              { key: "final", header: "Final", value: (row) => row.final, sortable: true },
              { key: "rounds", header: "Rounds", value: (row) => row.rounds },
              {
                key: "variance",
                header: "Variance",
                value: (row) => row.variance ?? "—",
                render: (row) =>
                  row.variance !== null && row.variance > exam.max_marks * 0.1 ? (
                    <Badge variant="destructive">{row.variance}</Badge>
                  ) : (
                    <span>{row.variance ?? "—"}</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                value: (row) => row.status,
                render: (row) => (
                  <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                value: () => "",
                render: (row) =>
                  canEvaluate ? (
                    <Button size="sm" variant="ghost" onClick={() => setEvalOpen(row.id)}>
                      Evaluate
                    </Button>
                  ) : null,
              },
            ]}
            emptyTitle="No scripts"
            emptyDescription="Enter marks for this paper to start evaluation."
          />
        </>
      ) : (
        <EmptyState title="Select an exam" description="Pick a paper to evaluate its scripts." />
      )}

      <RecordFormDialog
        open={Boolean(evalOpen)}
        onOpenChange={(open) => setEvalOpen(open ? evalOpen : null)}
        title="Record evaluation"
        description="Each round is stored separately so double and blind evaluation stay comparable."
        submitLabel="Save evaluation"
        fields={[
          {
            name: "kind",
            label: "Round type",
            type: "select",
            required: true,
            options: optionsOf(evaluationKinds),
          },
          { name: "round", label: "Round number", type: "number", required: true, min: 1 },
          { name: "marks_awarded", label: "Marks awarded", type: "number", required: true, min: 0 },
          {
            name: "evaluator_id",
            label: "Evaluator",
            type: "select",
            options: (lookups.faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
          {
            name: "is_blind",
            label: "Blind evaluation",
            type: "select",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          {
            name: "apply",
            label: "Post to mark sheet",
            type: "select",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
          { name: "remarks", label: "Remarks", type: "textarea", full: true },
        ]}
        onSubmit={async (values) => {
          if (!evalOpen) return;
          await record.mutateAsync({
            markId: evalOpen,
            kind: String(values["kind"]),
            round: Number(values["round"] ?? 1),
            marksAwarded: Number(values["marks_awarded"] ?? 0),
            evaluatorId: values["evaluator_id"] ? String(values["evaluator_id"]) : null,
            isBlind: values["is_blind"] === "true",
            applyToMark: values["apply"] !== "false",
            remarks: values["remarks"] ? String(values["remarks"]) : null,
          });
          setEvalOpen(null);
        }}
      />
    </>
  );
}
