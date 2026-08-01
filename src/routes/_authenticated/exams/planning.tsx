import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ExamConflictsPanel } from "@/components/exams/exam-conflicts-panel";
import { ResourcePage } from "@/components/common/resource-page";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionsFrom, useAcademicLookups } from "@/hooks/useAcademics";
import {
  useAssessmentTypes,
  useExamConflicts,
  useExamSessions,
  useGradingScales,
  type ExamRow,
} from "@/hooks/useExams";
import { formatDate } from "@/lib/export";
import { examStatuses, labelize, optionsOf, statusTone } from "@/lib/exams";

const ALL = "__all";

export const Route = createFileRoute("/_authenticated/exams/planning")({
  head: () => ({
    meta: [
      { title: "Exam timetable & planning — CampusOS" },
      {
        name: "description",
        content:
          "Schedule examination papers with live student, faculty, room and backlog conflict detection across the timetable.",
      },
      { property: "og:title", content: "Exam timetable & planning — CampusOS" },
      { property: "og:description", content: "Exam scheduling with conflict detection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamPlanningPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Planning unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function ExamPlanningPage() {
  const sessions = useExamSessions();
  const types = useAssessmentTypes();
  const scales = useGradingScales();
  const { courses, programs, semesters, sections } = useAcademicLookups();
  const { conflicts, loading } = useExamConflicts();
  const [sessionId, setSessionId] = useState(ALL);

  const courseById = useMemo(
    () => new Map((courses.data ?? []).map((row) => [row.id, row])),
    [courses.data],
  );

  return (
    <ResourcePage<ExamRow>
      title="Exam timetable"
      description="Papers, sittings, weightage and eligibility thresholds — validated against the live timetable."
      crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Planning" }]}
      table="exams"
      select="id, exam_session_id, course_id, program_id, semester_id, section_id, assessment_type_id, grading_scale_id, title, exam_date, starts_at, ends_at, duration_minutes, max_marks, passing_marks, internal_weightage, external_weightage, min_attendance_percentage, status, instructions"
      orderBy={{ column: "exam_date" }}
      managePermission="exam.create"
      entityLabel="exam"
      storageKey="exams-planning"
      defaults={sessionId !== ALL ? { exam_session_id: sessionId } : undefined}
      summary={<ExamConflictsPanel conflicts={conflicts} loading={loading} />}
      filters={
        <div className="grid gap-1.5">
          <Label htmlFor="exam-session-filter">Default session for new papers</Label>
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger id="exam-session-filter" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sessions</SelectItem>
              {(sessions.data ?? []).map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      columns={[
        { key: "title", header: "Paper", value: (row) => row.title, sortable: true },
        {
          key: "course",
          header: "Subject",
          value: (row) => (row.course_id ? (courseById.get(row.course_id)?.code ?? "—") : "—"),
        },
        {
          key: "session",
          header: "Session",
          value: (row) =>
            (sessions.data ?? []).find((item) => item.id === row.exam_session_id)?.name ?? "—",
        },
        { key: "date", header: "Date", value: (row) => formatDate(row.exam_date), sortable: true },
        {
          key: "time",
          header: "Time",
          value: (row) => `${row.starts_at ?? "—"} – ${row.ends_at ?? "—"}`,
        },
        { key: "max", header: "Max", value: (row) => row.max_marks },
        { key: "pass", header: "Pass", value: (row) => row.passing_marks },
        {
          key: "attendance",
          header: "Min attendance",
          value: (row) =>
            row.min_attendance_percentage === null ? "—" : `${row.min_attendance_percentage}%`,
        },
        {
          key: "status",
          header: "Status",
          value: (row) => row.status,
          render: (row) => <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>,
        },
      ]}
      fields={[
        { name: "title", label: "Paper title", required: true, full: true },
        {
          name: "exam_session_id",
          label: "Exam session",
          type: "select",
          required: true,
          options: (sessions.data ?? []).map((row) => ({ value: row.id, label: row.name })),
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
        {
          name: "program_id",
          label: "Programme",
          type: "select",
          options: optionsFrom(programs.data),
        },
        {
          name: "semester_id",
          label: "Semester",
          type: "select",
          options: optionsFrom(semesters.data, false),
        },
        {
          name: "section_id",
          label: "Section",
          type: "select",
          options: optionsFrom(sections.data),
        },
        {
          name: "assessment_type_id",
          label: "Assessment type",
          type: "select",
          options: (types.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "grading_scale_id",
          label: "Grading scale",
          type: "select",
          options: (scales.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        { name: "exam_date", label: "Exam date", type: "date" },
        { name: "starts_at", label: "Starts at", placeholder: "09:30" },
        { name: "ends_at", label: "Ends at", placeholder: "12:30" },
        { name: "duration_minutes", label: "Duration (minutes)", type: "number" },
        { name: "max_marks", label: "Max marks", type: "number", required: true },
        { name: "passing_marks", label: "Passing marks", type: "number", required: true },
        { name: "internal_weightage", label: "Internal weightage %", type: "number" },
        { name: "external_weightage", label: "External weightage %", type: "number" },
        {
          name: "min_attendance_percentage",
          label: "Minimum attendance %",
          type: "number",
          help: "Registrations below this are marked ineligible",
        },
        { name: "status", label: "Status", type: "select", options: optionsOf(examStatuses) },
        { name: "instructions", label: "Instructions", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        title: row.title,
        exam_session_id: row.exam_session_id,
        course_id: row.course_id ?? "",
        program_id: row.program_id ?? "",
        semester_id: row.semester_id ?? "",
        section_id: row.section_id ?? "",
        assessment_type_id: row.assessment_type_id ?? "",
        grading_scale_id: row.grading_scale_id ?? "",
        exam_date: row.exam_date ?? "",
        starts_at: row.starts_at ?? "",
        ends_at: row.ends_at ?? "",
        duration_minutes: row.duration_minutes ?? null,
        max_marks: row.max_marks,
        passing_marks: row.passing_marks,
        internal_weightage: row.internal_weightage,
        external_weightage: row.external_weightage,
        min_attendance_percentage: row.min_attendance_percentage ?? null,
        status: row.status,
        instructions: row.instructions ?? "",
      })}
    />
  );
}
