import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { optionsFrom, useAcademicLookups } from "@/hooks/useAcademics";
import type { ExamSessionRow } from "@/hooks/useExams";
import { formatDate } from "@/lib/export";
import { assessmentCategories, labelize, optionsOf, statusTone } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/sessions")({
  head: () => ({
    meta: [
      { title: "Exam sessions — CampusOS" },
      {
        name: "description",
        content:
          "Plan examination sessions and windows: registration dates, hall ticket release, and expected result dates.",
      },
      { property: "og:title", content: "Exam sessions — CampusOS" },
      { property: "og:description", content: "Examination windows and calendar planning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamSessionsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Sessions unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function ExamSessionsPage() {
  const { academicSessions, semesters } = useAcademicLookups();

  return (
    <ResourcePage<ExamSessionRow>
      title="Exam sessions"
      description="Examination windows with registration, hall ticket and result milestones."
      crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Sessions" }]}
      table="exam_sessions"
      select="id, academic_session_id, semester_id, name, code, category, starts_on, ends_on, registration_opens_on, registration_closes_on, hall_ticket_release_on, result_expected_on, status, instructions"
      orderBy={{ column: "starts_on", ascending: false }}
      managePermission="exam.create"
      entityLabel="exam session"
      storageKey="exam-sessions"
      columns={[
        { key: "name", header: "Session", value: (row) => row.name, sortable: true },
        { key: "code", header: "Code", value: (row) => row.code },
        {
          key: "category",
          header: "Category",
          value: (row) => row.category,
          render: (row) => <Badge variant="secondary">{labelize(row.category)}</Badge>,
        },
        {
          key: "starts",
          header: "Starts",
          value: (row) => formatDate(row.starts_on),
          sortable: true,
        },
        { key: "ends", header: "Ends", value: (row) => formatDate(row.ends_on) },
        {
          key: "registration",
          header: "Registration",
          value: (row) =>
            row.registration_opens_on
              ? `${formatDate(row.registration_opens_on)} → ${formatDate(row.registration_closes_on)}`
              : "—",
        },
        {
          key: "hall",
          header: "Hall ticket",
          value: (row) => formatDate(row.hall_ticket_release_on),
        },
        {
          key: "status",
          header: "Status",
          value: (row) => row.status,
          render: (row) => <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>,
        },
      ]}
      fields={[
        { name: "name", label: "Session name", required: true },
        { name: "code", label: "Code", required: true, help: "Used to prefix hall ticket numbers" },
        {
          name: "category",
          label: "Category",
          type: "select",
          required: true,
          options: optionsOf(assessmentCategories),
        },
        {
          name: "academic_session_id",
          label: "Academic term",
          type: "select",
          options: optionsFrom(academicSessions.data, false),
        },
        {
          name: "semester_id",
          label: "Semester",
          type: "select",
          options: optionsFrom(semesters.data, false),
        },
        { name: "starts_on", label: "Starts on", type: "date", required: true },
        { name: "ends_on", label: "Ends on", type: "date", required: true },
        { name: "registration_opens_on", label: "Registration opens", type: "date" },
        { name: "registration_closes_on", label: "Registration closes", type: "date" },
        { name: "hall_ticket_release_on", label: "Hall ticket release", type: "date" },
        { name: "result_expected_on", label: "Result expected", type: "date" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: optionsOf([
            "planned",
            "registration_open",
            "in_progress",
            "completed",
            "cancelled",
          ] as const),
        },
        { name: "instructions", label: "Instructions to candidates", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        name: row.name,
        code: row.code,
        category: row.category,
        academic_session_id: row.academic_session_id ?? "",
        semester_id: row.semester_id ?? "",
        starts_on: row.starts_on,
        ends_on: row.ends_on,
        registration_opens_on: row.registration_opens_on ?? "",
        registration_closes_on: row.registration_closes_on ?? "",
        hall_ticket_release_on: row.hall_ticket_release_on ?? "",
        result_expected_on: row.result_expected_on ?? "",
        status: row.status,
        instructions: row.instructions ?? "",
      })}
    />
  );
}
