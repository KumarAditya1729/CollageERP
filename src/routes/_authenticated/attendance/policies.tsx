import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { labelize, optionsFrom, useAcademicLookups } from "@/hooks/useAcademics";
import { type AttendancePolicyRow } from "@/hooks/useAttendance";
import { attendeeKinds } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/policies")({
  head: () => ({
    meta: [
      { title: "Attendance policies — CampusOS" },
      {
        name: "description",
        content:
          "Configure minimum attendance, grace periods, late rules, condonation and how approved leave affects percentages.",
      },
      { property: "og:title", content: "Attendance policies — CampusOS" },
      {
        property: "og:description",
        content: "Thresholds, grace periods and leave treatment per department.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PoliciesPage,
});

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function PoliciesPage() {
  const { departments, programs } = useAcademicLookups();

  return (
    <>
      <PageHeader
        title="Attendance policies"
        description="Policies cascade from the institution down to a department or programme; the most specific match wins."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Policies" }]}
      />

      <ResourcePage<AttendancePolicyRow>
        hideHeader
        title="Policies"
        description="Policies"
        table="attendance_policies"
        select="id, name, description, department_id, program_id, attendee_kind, minimum_percentage, warning_percentage, penalty_percentage, grace_minutes, late_after_minutes, late_counts_as_present, count_holidays, approved_leave_counts, medical_leave_counts, duty_leave_counts, corrections_need_approval, freeze_after_days, frozen_until, is_active"
        orderBy={{ column: "name" }}
        managePermission="attendance.policy"
        entityLabel="policy"
        storageKey="attendance-policies"
        columns={[
          { key: "name", header: "Policy", alwaysVisible: true },
          {
            key: "scope",
            header: "Scope",
            value: (row) =>
              departments.data?.find((item) => item.id === row.department_id)?.name ??
              programs.data?.find((item) => item.id === row.program_id)?.name ??
              "Institution-wide",
          },
          {
            key: "attendee_kind",
            header: "Applies to",
            value: (row) => labelize(row.attendee_kind),
          },
          {
            key: "minimum_percentage",
            header: "Minimum %",
            value: (row) => `${row.minimum_percentage}%`,
          },
          {
            key: "warning_percentage",
            header: "Warning %",
            value: (row) => `${row.warning_percentage}%`,
          },
          { key: "grace_minutes", header: "Grace (min)", value: (row) => row.grace_minutes },
          {
            key: "late_counts_as_present",
            header: "Late counts",
            value: (row) => (row.late_counts_as_present ? "Yes" : "No"),
          },
          {
            key: "is_active",
            header: "Status",
            render: (row) => (
              <Badge variant={row.is_active ? "secondary" : "outline"}>
                {row.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
            value: (row) => (row.is_active ? "active" : "inactive"),
          },
        ]}
        fields={[
          { name: "name", label: "Policy name", required: true },
          {
            name: "attendee_kind",
            label: "Applies to",
            type: "select",
            required: true,
            options: attendeeKinds.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: optionsFrom(departments.data),
          },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            options: optionsFrom(programs.data),
          },
          {
            name: "minimum_percentage",
            label: "Minimum %",
            type: "number",
            required: true,
            min: 0,
            max: 100,
          },
          {
            name: "warning_percentage",
            label: "Warning %",
            type: "number",
            required: true,
            min: 0,
            max: 100,
          },
          {
            name: "penalty_percentage",
            label: "Penalty %",
            type: "number",
            required: true,
            min: 0,
            max: 100,
            help: "Below this, exam eligibility is withheld.",
          },
          { name: "grace_minutes", label: "Grace minutes", type: "number", required: true, min: 0 },
          {
            name: "late_after_minutes",
            label: "Late after (minutes)",
            type: "number",
            required: true,
            min: 0,
          },
          {
            name: "late_counts_as_present",
            label: "Late counts as present",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "count_holidays",
            label: "Count holidays",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "approved_leave_counts",
            label: "Approved leave counts",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "medical_leave_counts",
            label: "Medical leave counts",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "duty_leave_counts",
            label: "On-duty counts",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "corrections_need_approval",
            label: "Corrections need approval",
            type: "select",
            options: booleanOptions,
          },
          {
            name: "freeze_after_days",
            label: "Freeze after (days)",
            type: "number",
            min: 0,
            help: "Sessions lock automatically this many days after the class.",
          },
          { name: "frozen_until", label: "Frozen until", type: "date" },
          { name: "is_active", label: "Active", type: "select", options: booleanOptions },
          { name: "description", label: "Description", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          name: row.name,
          attendee_kind: row.attendee_kind,
          department_id: row.department_id,
          program_id: row.program_id,
          minimum_percentage: row.minimum_percentage,
          warning_percentage: row.warning_percentage,
          penalty_percentage: row.penalty_percentage,
          grace_minutes: row.grace_minutes,
          late_after_minutes: row.late_after_minutes,
          late_counts_as_present: String(row.late_counts_as_present),
          count_holidays: String(row.count_holidays),
          approved_leave_counts: String(row.approved_leave_counts),
          medical_leave_counts: String(row.medical_leave_counts),
          duty_leave_counts: String(row.duty_leave_counts),
          corrections_need_approval: String(row.corrections_need_approval),
          freeze_after_days: row.freeze_after_days,
          frozen_until: row.frozen_until,
          is_active: String(row.is_active),
          description: row.description,
        })}
      />
    </>
  );
}
