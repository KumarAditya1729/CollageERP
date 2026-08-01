import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import {
  useExams,
  useMarks,
  useRevaluationPayment,
  useRevaluations,
  useReviewRevaluation,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate } from "@/lib/export";
import { labelize, statusTone } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/revaluation")({
  head: () => ({
    meta: [
      { title: "Revaluation & challenge requests — CampusOS" },
      {
        name: "description",
        content:
          "Track revaluation, rechecking, retotal and challenge-evaluation requests with payment status, review workflow and mark updates.",
      },
      { property: "og:title", content: "Revaluation & challenge requests — CampusOS" },
      { property: "og:description", content: "Revaluation workflow with payment tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RevaluationPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Revaluation unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface RequestRow extends Record<string, unknown> {
  id: string;
  student: string;
  roll: string | null;
  exam: string;
  kind: string;
  reason: string;
  status: string;
  payment: string;
  fee: number;
  original: number | null;
  revised: number | null;
  markId: string | null;
  requestedOn: string;
}

function RevaluationPage() {
  const { can } = useAccess();
  const requests = useRevaluations();
  const exams = useExams();
  const students = useStudentRegister();
  const marks = useMarks();
  const review = useReviewRevaluation();
  const payment = useRevaluationPayment();

  const [reviewOpen, setReviewOpen] = useState<RequestRow | null>(null);
  const [payOpen, setPayOpen] = useState<string | null>(null);

  const canReview = can("exam.approve") || can("marks.approve");
  const examById = useMemo(
    () => new Map((exams.data ?? []).map((row) => [row.id, row])),
    [exams.data],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const rows = useMemo<RequestRow[]>(
    () =>
      (requests.data ?? []).map((row) => {
        const student = studentById.get(row.student_id);
        const mark =
          row.mark_id ??
          (marks.data ?? []).find(
            (item) => item.exam_id === row.exam_id && item.student_id === row.student_id,
          )?.id ??
          null;
        return {
          id: row.id,
          student: student ? studentName(student) : "Unknown student",
          roll: student?.roll_number ?? student?.admission_number ?? null,
          exam: examById.get(row.exam_id)?.title ?? "—",
          kind: row.kind,
          reason: row.reason,
          status: row.status,
          payment: row.payment_status,
          fee: row.fee_amount,
          original: row.original_marks,
          revised: row.revised_marks,
          markId: mark,
          requestedOn: row.created_at,
        } satisfies RequestRow;
      }),
    [requests.data, studentById, examById, marks.data],
  );

  const pending = rows.filter((row) => row.status === "pending").length;
  const unpaid = rows.filter((row) => row.payment !== "paid").length;
  const revised = rows.filter((row) => row.revised !== null).length;

  return (
    <>
      <PageHeader
        title="Revaluation & challenges"
        description="Rechecking, revaluation, retotal and challenge-evaluation requests, with fee tracking and an auditable review trail."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Revaluation" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "revaluation-requests",
                ["Roll", "Student", "Exam", "Kind", "Status", "Payment", "Original", "Revised"],
                rows.map((row) => [
                  row.roll,
                  row.student,
                  row.exam,
                  row.kind,
                  row.status,
                  row.payment,
                  row.original,
                  row.revised,
                ]),
              )
            }
            disabled={!rows.length}
          >
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests" value={rows.length} />
        <StatCard label="Awaiting review" value={pending} />
        <StatCard label="Payment pending" value={unpaid} />
        <StatCard label="Marks revised" value={revised} />
      </div>

      <DataTable<RequestRow>
        rows={rows}
        loading={requests.isLoading}
        storageKey="exam-revaluation"
        exportName="revaluation"
        getRowId={(row) => row.id}
        columns={[
          { key: "roll", header: "Roll", value: (row) => row.roll ?? "—", sortable: true },
          { key: "student", header: "Student", value: (row) => row.student, sortable: true },
          { key: "exam", header: "Exam", value: (row) => row.exam, sortable: true },
          {
            key: "kind",
            header: "Type",
            value: (row) => row.kind,
            render: (row) => <Badge variant="outline">{labelize(row.kind)}</Badge>,
          },
          {
            key: "payment",
            header: "Payment",
            value: (row) => row.payment,
            render: (row) => (
              <Badge variant={row.payment === "paid" ? "secondary" : "outline"}>
                {labelize(row.payment)}
              </Badge>
            ),
          },
          { key: "fee", header: "Fee", value: (row) => row.fee },
          { key: "original", header: "Original", value: (row) => row.original ?? "—" },
          { key: "revised", header: "Revised", value: (row) => row.revised ?? "—" },
          {
            key: "status",
            header: "Status",
            value: (row) => row.status,
            render: (row) => <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>,
          },
          { key: "requested", header: "Requested", value: (row) => formatDate(row.requestedOn) },
          {
            key: "actions",
            header: "",
            value: () => "",
            render: (row) => (
              <div className="flex gap-1">
                {row.payment !== "paid" ? (
                  <Button size="sm" variant="ghost" onClick={() => setPayOpen(row.id)}>
                    <CreditCard className="size-4" />
                  </Button>
                ) : null}
                {canReview && row.status === "pending" ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setReviewOpen(row)}>
                      <BadgeCheck className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        review.mutate({ id: row.id, status: "rejected", notes: "Request rejected" })
                      }
                    >
                      <XCircle className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        emptyTitle="No requests"
        emptyDescription="Students can raise revaluation requests from their results page."
      />

      <RecordFormDialog
        open={Boolean(payOpen)}
        onOpenChange={(open) => setPayOpen(open ? payOpen : null)}
        title="Record payment"
        description="Capture the payment reference for this revaluation fee."
        submitLabel="Mark paid"
        fields={[{ name: "reference", label: "Payment reference", required: true }]}
        onSubmit={async (values) => {
          if (!payOpen) return;
          await payment.mutateAsync({ id: payOpen, reference: String(values["reference"]) });
          setPayOpen(null);
        }}
      />

      <RecordFormDialog
        open={Boolean(reviewOpen)}
        onOpenChange={(open) => setReviewOpen(open ? reviewOpen : null)}
        title="Approve revaluation"
        description="The revised mark is posted back to the marks sheet for moderation."
        submitLabel="Approve"
        fields={[
          { name: "revised_marks", label: "Revised marks", type: "number", required: true, min: 0 },
          { name: "notes", label: "Review notes", type: "textarea", full: true },
        ]}
        onSubmit={async (values) => {
          if (!reviewOpen) return;
          await review.mutateAsync({
            id: reviewOpen.id,
            status: "approved",
            revisedMarks: Number(values["revised_marks"] ?? 0),
            notes: values["notes"] ? String(values["notes"]) : undefined,
            markId: reviewOpen.markId,
          });
          setReviewOpen(null);
        }}
      />
    </>
  );
}
