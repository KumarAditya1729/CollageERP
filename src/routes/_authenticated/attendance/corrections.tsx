import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import { labelize, studentLabel, useStudentRecords } from "@/hooks/useAcademics";
import {
  useApprovalActions,
  useAttendanceRecords,
  type CorrectionRow,
} from "@/hooks/useAttendance";
import { attendanceStatuses, approvalStates } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/corrections")({
  head: () => ({
    meta: [
      { title: "Attendance corrections — CampusOS" },
      {
        name: "description",
        content:
          "Request and approve attendance corrections with a full audit trail of old and new status.",
      },
      { property: "og:title", content: "Attendance corrections — CampusOS" },
      { property: "og:description", content: "Retrospective attendance fixes with approvals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CorrectionsPage,
});

function CorrectionsPage() {
  const { can } = useAccess();
  const canReview = can("attendance.correct");
  const records = useAttendanceRecords();
  const students = useStudentRecords();
  const { reviewCorrection } = useApprovalActions();

  const recordLabel = (id: string) => {
    const record = records.data?.find((row) => row.id === id);
    if (!record) return "Attendance mark";
    const student = students.data?.find((row) => row.id === record.student_id);
    return `${student ? studentLabel(student) : labelize(record.attendee_kind)} · ${labelize(record.status)}`;
  };

  return (
    <>
      <PageHeader
        title="Attendance corrections"
        description="Every retrospective change is requested, reviewed and written back to the original mark."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Corrections" }]}
      />

      <ResourcePage<CorrectionRow>
        hideHeader
        title="Corrections"
        description="Corrections"
        table="attendance_corrections"
        select="id, attendance_record_id, old_status, new_status, reason, status, requested_by, review_notes"
        orderBy={{ column: "created_at", ascending: false }}
        managePermission="attendance.correct"
        entityLabel="correction"
        storageKey="attendance-corrections"
        columns={[
          {
            key: "attendance_record_id",
            header: "Mark",
            alwaysVisible: true,
            value: (row) => recordLabel(row.attendance_record_id),
          },
          { key: "old_status", header: "From", value: (row) => labelize(row.old_status) },
          { key: "new_status", header: "To", value: (row) => labelize(row.new_status) },
          { key: "reason", header: "Reason", value: (row) => row.reason ?? "—" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge
                variant={
                  row.status === "approved"
                    ? "default"
                    : row.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {labelize(row.status)}
              </Badge>
            ),
            value: (row) => row.status,
          },
        ]}
        rowExtras={(row) =>
          canReview && row.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  reviewCorrection.mutate({
                    id: row.id,
                    recordId: row.attendance_record_id,
                    newStatus: row.new_status,
                    status: "approved",
                  })
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  reviewCorrection.mutate({
                    id: row.id,
                    recordId: row.attendance_record_id,
                    newStatus: row.new_status,
                    status: "rejected",
                  })
                }
              >
                Reject
              </Button>
            </div>
          ) : null
        }
        fields={[
          {
            name: "attendance_record_id",
            label: "Attendance mark",
            type: "select",
            required: true,
            options: (records.data ?? []).slice(0, 300).map((row) => ({
              value: row.id,
              label: recordLabel(row.id),
            })),
          },
          {
            name: "old_status",
            label: "Current status",
            type: "select",
            required: true,
            options: attendanceStatuses.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "new_status",
            label: "Corrected status",
            type: "select",
            required: true,
            options: attendanceStatuses.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "status",
            label: "Approval",
            type: "select",
            required: true,
            options: approvalStates.map((value) => ({ value, label: labelize(value) })),
          },
          { name: "reason", label: "Reason", type: "textarea", full: true },
          { name: "review_notes", label: "Review notes", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          attendance_record_id: row.attendance_record_id,
          old_status: row.old_status,
          new_status: row.new_status,
          status: row.status,
          reason: row.reason,
          review_notes: row.review_notes,
        })}
      />
    </>
  );
}
