import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Send, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { ErrorState } from "@/components/common/states";
import { QuestionPicker } from "@/components/exams/question-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicLookups } from "@/hooks/useAcademics";
import {
  useCourseOutcomes,
  useExams,
  usePaperQuestionMutations,
  usePaperQuestions,
  usePaperWorkflow,
  useQuestionPapers,
  useQuestions,
  type QuestionPaperRow,
} from "@/hooks/useExams";
import { formatDateTime } from "@/lib/export";
import { labelize, optionsOf, paperStatuses, statusTone } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/papers")({
  head: () => ({
    meta: [
      { title: "Question papers — CampusOS" },
      {
        name: "description",
        content:
          "Build, version and approve question papers from the outcome-mapped question bank with blueprint and Bloom analytics.",
      },
      { property: "og:title", content: "Question papers — CampusOS" },
      { property: "og:description", content: "Paper setting, blueprint and approval workflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PapersPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Papers unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function PapersPage() {
  const { can } = useAccess();
  const { courses } = useAcademicLookups();
  const exams = useExams();
  const papers = useQuestionPapers();
  const questions = useQuestions();
  const paperQuestions = usePaperQuestions();
  const outcomes = useCourseOutcomes();
  const workflow = usePaperWorkflow();
  const { add, remove } = usePaperQuestionMutations();
  const [paperId, setPaperId] = useState<string | null>(null);

  const paper = useMemo(
    () => (papers.data ?? []).find((row) => row.id === paperId) ?? null,
    [papers.data, paperId],
  );

  const questionById = useMemo(
    () => new Map((questions.data ?? []).map((row) => [row.id, row])),
    [questions.data],
  );

  const attached = useMemo(
    () =>
      (paperQuestions.data ?? [])
        .filter((row) => row.question_paper_id === paperId)
        .sort((a, b) =>
          a.section_label === b.section_label
            ? a.sort_order - b.sort_order
            : a.section_label.localeCompare(b.section_label),
        )
        .map((row) => ({ ...row, question: questionById.get(row.question_id) })),
    [paperQuestions.data, paperId, questionById],
  );

  const bankForPaper = useMemo(
    () =>
      (questions.data ?? []).filter(
        (row) => row.is_active && (!paper?.course_id || row.course_id === paper.course_id),
      ),
    [questions.data, paper?.course_id],
  );

  const outcomeLabel = (id: string | null) =>
    (outcomes.data ?? []).find((row) => row.id === id)?.code ?? "No CO";

  const canApprove = can("exam.approve");
  const readOnly = !paper || ["approved", "locked", "published"].includes(paper.status);

  return (
    <>
      <PageHeader
        title="Question papers"
        description="Paper setting with blueprint compliance, versioning and a maker–checker approval workflow."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Question papers" }]}
      />

      <ResourcePage<QuestionPaperRow>
        hideHeader
        title="Papers"
        description=""
        table="question_papers"
        select="id, exam_id, course_id, title, code, version, set_label, status, total_marks, duration_minutes, blueprint, instructions, is_encrypted, setter_id, approver_id, approved_at, rejection_reason, created_at"
        orderBy={{ column: "created_at", ascending: false }}
        managePermission="questionpaper.manage"
        entityLabel="question paper"
        storageKey="exam-question-papers"
        onRowClick={(row) => setPaperId(row.id)}
        columns={[
          { key: "title", header: "Paper", value: (row) => row.title, sortable: true },
          {
            key: "exam",
            header: "Exam",
            value: (row) =>
              (exams.data ?? []).find((item) => item.id === row.exam_id)?.title ?? "—",
          },
          {
            key: "course",
            header: "Subject",
            value: (row) =>
              (courses.data ?? []).find((item) => item.id === row.course_id)?.code ?? "—",
          },
          { key: "set", header: "Set", value: (row) => row.set_label },
          { key: "version", header: "Version", value: (row) => row.version },
          { key: "marks", header: "Marks", value: (row) => row.total_marks },
          {
            key: "status",
            header: "Status",
            value: (row) => row.status,
            render: (row) => <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>,
          },
          { key: "approved", header: "Approved", value: (row) => formatDateTime(row.approved_at) },
        ]}
        fields={[
          { name: "title", label: "Paper title", required: true, full: true },
          {
            name: "exam_id",
            label: "Exam",
            type: "select",
            options: (exams.data ?? []).map((row) => ({ value: row.id, label: row.title })),
          },
          {
            name: "course_id",
            label: "Subject",
            type: "select",
            options: (courses.data ?? []).map((row) => ({
              value: row.id,
              label: `${row.code} — ${row.title}`,
            })),
          },
          { name: "code", label: "Paper code" },
          { name: "set_label", label: "Set", placeholder: "A" },
          { name: "version", label: "Version", type: "number" },
          { name: "total_marks", label: "Total marks", type: "number", required: true },
          { name: "duration_minutes", label: "Duration (minutes)", type: "number", required: true },
          { name: "status", label: "Status", type: "select", options: optionsOf(paperStatuses) },
          { name: "instructions", label: "Instructions", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          title: row.title,
          exam_id: row.exam_id ?? "",
          course_id: row.course_id ?? "",
          code: row.code ?? "",
          set_label: row.set_label,
          version: row.version,
          total_marks: row.total_marks,
          duration_minutes: row.duration_minutes,
          status: row.status,
          instructions: row.instructions ?? "",
        })}
      />

      {paper ? (
        <Card className="shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {paper.title} · set {paper.set_label} · v{paper.version}
              </CardTitle>
              <CardDescription>
                {paper.total_marks} marks over {paper.duration_minutes} minutes ·{" "}
                {labelize(paper.status)}
                {paper.rejection_reason ? ` · Returned: ${paper.rejection_reason}` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {paper.status === "draft" ? (
                <Button
                  variant="outline"
                  onClick={() => workflow.mutate({ id: paper.id, status: "pending_approval" })}
                  disabled={workflow.isPending}
                >
                  <Send className="size-4" />
                  Submit for approval
                </Button>
              ) : null}
              {canApprove && paper.status === "pending_approval" ? (
                <>
                  <Button
                    onClick={() => workflow.mutate({ id: paper.id, status: "approved" })}
                    disabled={workflow.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      workflow.mutate({
                        id: paper.id,
                        status: "rejected",
                        reason: "Returned to the setter for revision",
                      })
                    }
                    disabled={workflow.isPending}
                  >
                    <XCircle className="size-4" />
                    Return
                  </Button>
                </>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <QuestionPicker
              questions={bankForPaper}
              attached={attached}
              outcomeLabel={outcomeLabel}
              totalMarks={paper.total_marks}
              readOnly={readOnly}
              onAdd={(selected, sectionLabel) =>
                add.mutate({ paperId: paper.id, questions: selected, sectionLabel })
              }
              onRemove={(ids) => remove.mutate(ids)}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a paper above to build its blueprint from the question bank.
        </p>
      )}
    </>
  );
}
