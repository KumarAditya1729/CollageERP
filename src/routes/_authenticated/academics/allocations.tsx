import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  allocationRoles,
  facultyName,
  labelize,
  optionsFrom,
  useAcademicLookups,
  useFacultyWorkload,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/allocations")({
  head: () => ({
    meta: [
      { title: "Faculty allocation — CampusOS" },
      {
        name: "description",
        content:
          "Assign faculty to subjects, sections and sessions, and track weekly teaching load across departments.",
      },
      { property: "og:title", content: "Faculty allocation — CampusOS" },
      { property: "og:description", content: "Subject allocation and workload analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AllocationsPage,
});

interface AllocationRow extends Record<string, unknown> {
  id: string;
  faculty_id: string;
  course_id: string;
  section_id: string | null;
  semester_id: string | null;
  academic_session_id: string | null;
  role: string;
  hours_per_week: number;
  is_active: boolean;
}

function AllocationsPage() {
  const { faculty, courses, sections, semesters, academicSessions, departments } =
    useAcademicLookups();
  const workload = useFacultyWorkload();

  const summary = useMemo(() => {
    const map = new Map<string, { hours: number; subjects: number }>();
    for (const row of workload.data ?? []) {
      if (!row.is_active) continue;
      const current = map.get(row.faculty_id) ?? { hours: 0, subjects: 0 };
      current.hours += Number(row.hours_per_week ?? 0);
      current.subjects += 1;
      map.set(row.faculty_id, current);
    }
    const rows = [...map.entries()]
      .map(([id, value]) => {
        const member = faculty.data?.find((f) => f.id === id);
        return {
          id,
          name: member ? facultyName(member) : "Unknown faculty",
          department:
            departments.data?.find((d) => d.id === member?.department_id)?.name ??
            "Unassigned department",
          ...value,
        };
      })
      .sort((a, b) => b.hours - a.hours);
    return rows;
  }, [workload.data, faculty.data, departments.data]);

  const maxHours = Math.max(1, ...summary.map((row) => row.hours));

  const facultyOptions = (faculty.data ?? []).map((row) => ({
    value: row.id,
    label: row.employee_code ? `${row.employee_code} — ${facultyName(row)}` : facultyName(row),
  }));
  const courseOptions = (courses.data ?? []).map((row) => ({
    value: row.id,
    label: `${row.code} — ${row.title}`,
  }));

  return (
    <ResourcePage<AllocationRow>
      title="Faculty allocation"
      description="Who teaches what, where and for how many hours a week — the input for timetabling and workload compliance."
      crumbs={[{ label: "Academics", to: "/academics" }, { label: "Faculty allocation" }]}
      table="faculty_allocations"
      select="id, faculty_id, course_id, section_id, semester_id, academic_session_id, role, hours_per_week, is_active"
      campusScoped
      managePermission="faculty.assign"
      entityLabel="allocation"
      storageKey="faculty-allocations"
      summary={
        <Card>
          <CardHeader>
            <CardTitle>Workload analytics</CardTitle>
            <CardDescription>
              Active weekly hours and subject count per faculty member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active allocations yet — create one below to build the workload picture.
              </p>
            ) : (
              summary.slice(0, 10).map((row) => (
                <div key={row.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground">
                      {row.department} · {row.subjects} subjects · {row.hours} h/week
                    </span>
                  </div>
                  <Progress value={(row.hours / maxHours) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      }
      columns={[
        {
          key: "faculty_id",
          header: "Faculty",
          alwaysVisible: true,
          className: "font-medium",
          value: (row) => {
            const member = faculty.data?.find((f) => f.id === row.faculty_id);
            return member ? facultyName(member) : null;
          },
        },
        {
          key: "course_id",
          header: "Subject",
          value: (row) => {
            const course = courses.data?.find((c) => c.id === row.course_id);
            return course ? `${course.code} — ${course.title}` : null;
          },
        },
        {
          key: "section_id",
          header: "Section",
          value: (row) => sections.data?.find((s) => s.id === row.section_id)?.name ?? null,
        },
        {
          key: "semester_id",
          header: "Semester",
          value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? null,
        },
        {
          key: "academic_session_id",
          header: "Term",
          value: (row) =>
            academicSessions.data?.find((s) => s.id === row.academic_session_id)?.name ?? null,
          defaultHidden: true,
        },
        {
          key: "role",
          header: "Role",
          render: (row) => <Badge variant="outline">{labelize(row.role)}</Badge>,
        },
        { key: "hours_per_week", header: "Hours/week" },
        {
          key: "is_active",
          header: "Status",
          value: (row) => (row.is_active ? "Active" : "Ended"),
          render: (row) => (
            <Badge variant={row.is_active ? "default" : "secondary"}>
              {row.is_active ? "Active" : "Ended"}
            </Badge>
          ),
        },
      ]}
      fields={[
        {
          name: "faculty_id",
          label: "Faculty",
          type: "select",
          required: true,
          options: facultyOptions,
        },
        {
          name: "course_id",
          label: "Subject",
          type: "select",
          required: true,
          options: courseOptions,
        },
        {
          name: "section_id",
          label: "Section",
          type: "select",
          options: optionsFrom(sections.data),
        },
        {
          name: "semester_id",
          label: "Semester",
          type: "select",
          options: (semesters.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "academic_session_id",
          label: "Term",
          type: "select",
          options: (academicSessions.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "role",
          label: "Role",
          type: "select",
          required: true,
          options: allocationRoles.map((value) => ({ value, label: labelize(value) })),
        },
        {
          name: "hours_per_week",
          label: "Hours per week",
          type: "number",
          required: true,
          min: 0,
          max: 60,
        },
      ]}
      toFormValues={(row) => ({
        faculty_id: row.faculty_id,
        course_id: row.course_id,
        section_id: row.section_id ?? "",
        semester_id: row.semester_id ?? "",
        academic_session_id: row.academic_session_id ?? "",
        role: row.role,
        hours_per_week: row.hours_per_week,
      })}
    />
  );
}
