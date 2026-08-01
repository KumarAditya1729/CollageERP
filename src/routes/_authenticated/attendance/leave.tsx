import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import {
  facultyName,
  labelize,
  studentLabel,
  useAcademicLookups,
  useStudentRecords,
} from "@/hooks/useAcademics";
import { useApprovalActions, useLeaveRequests, type LeaveRequestRow } from "@/hooks/useAttendance";
import { approvalStates, attendeeKinds, leaveKinds } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/leave")({
  head: () => ({
    meta: [
      { title: "Leave requests — CampusOS" },
      {
        name: "description",
        content:
          "Student, faculty and staff leave requests with approvals that automatically adjust attendance percentages.",
      },
      { property: "og:title", content: "Leave requests — CampusOS" },
      {
        property: "og:description",
        content: "Medical, duty and personal leave with attendance adjustment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeavePage,
});

function LeavePage() {
  const { can } = useAccess();
  const canManage = can("leave.manage");
  const leave = useLeaveRequests();
  const students = useStudentRecords();
  const { faculty } = useAcademicLookups();
  const { reviewLeave } = useApprovalActions();

  const rows = leave.data ?? [];
  const pending = rows.filter((row) => row.status === "pending").length;
  const approved = rows.filter((row) => row.status === "approved").length;

  const requester = (row: LeaveRequestRow) => {
    if (row.student_id) {
      const student = students.data?.find((item) => item.id === row.student_id);
      return student ? studentLabel(student) : "Student";
    }
    if (row.faculty_id) {
      const member = faculty.data?.find((item) => item.id === row.faculty_id);
      return member ? facultyName(member) : "Faculty";
    }
    return labelize(row.attendee_kind);
  };

  return (
    <>
      <PageHeader
        title="Leave requests"
        description="Approved leave feeds straight into attendance: medical, on-duty and approved absences are treated per policy."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Leave" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting review"
          value={pending}
          hint="Needs a decision"
          loading={leave.isLoading}
        />
        <StatCard label="Approved" value={approved} hint="Counted per policy" />
        <StatCard label="Total requests" value={rows.length} hint="All time" />
      </div>

      <ResourcePage<LeaveRequestRow>
        hideHeader
        title="Leave"
        description="Leave"
        table="leave_requests"
        select="id, attendee_kind, student_id, faculty_id, staff_id, requested_by, leave_kind, from_date, to_date, is_half_day, reason, status, adjusts_attendance, review_notes"
        orderBy={{ column: "from_date", ascending: false }}
        managePermission="leave.manage"
        entityLabel="leave request"
        storageKey="leave-requests"
        columns={[
          { key: "from_date", header: "From", alwaysVisible: true },
          { key: "to_date", header: "To" },
          { key: "requester", header: "Requester", value: (row) => requester(row) },
          { key: "attendee_kind", header: "Kind", value: (row) => labelize(row.attendee_kind) },
          { key: "leave_kind", header: "Leave type", value: (row) => labelize(row.leave_kind) },
          {
            key: "adjusts_attendance",
            header: "Adjusts attendance",
            value: (row) => (row.adjusts_attendance ? "Yes" : "No"),
          },
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
          canManage && row.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => reviewLeave.mutate({ id: row.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reviewLeave.mutate({ id: row.id, status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          ) : null
        }
        fields={[
          {
            name: "attendee_kind",
            label: "Requester type",
            type: "select",
            required: true,
            options: attendeeKinds.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "student_id",
            label: "Student",
            type: "select",
            options: (students.data ?? []).map((row) => ({
              value: row.id,
              label: studentLabel(row),
            })),
          },
          {
            name: "faculty_id",
            label: "Faculty",
            type: "select",
            options: (faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
          {
            name: "leave_kind",
            label: "Leave type",
            type: "select",
            required: true,
            options: leaveKinds.map((value) => ({ value, label: labelize(value) })),
          },
          { name: "from_date", label: "From", type: "date", required: true },
          { name: "to_date", label: "To", type: "date", required: true },
          {
            name: "is_half_day",
            label: "Half day",
            type: "select",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          {
            name: "adjusts_attendance",
            label: "Adjust attendance",
            type: "select",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: approvalStates.map((value) => ({ value, label: labelize(value) })),
          },
          { name: "reason", label: "Reason", type: "textarea", full: true },
          { name: "review_notes", label: "Review notes", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          attendee_kind: row.attendee_kind,
          student_id: row.student_id,
          faculty_id: row.faculty_id,
          leave_kind: row.leave_kind,
          from_date: row.from_date,
          to_date: row.to_date,
          is_half_day: String(row.is_half_day),
          adjusts_attendance: String(row.adjusts_attendance),
          status: row.status,
          reason: row.reason,
          review_notes: row.review_notes,
        })}
      />
    </>
  );
}
