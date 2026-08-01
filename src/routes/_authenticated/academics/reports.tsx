import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { facultyName, useAcademicLookups, useFacultyWorkload } from "@/hooks/useAcademics";
import { useResourceList } from "@/hooks/useResource";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/reports")({
  head: () => ({
    meta: [
      { title: "Academic reports — CampusOS" },
      {
        name: "description",
        content:
          "Department, programme, enrolment, credit, curriculum and faculty workload reports with CSV export.",
      },
      { property: "og:title", content: "Academic reports — CampusOS" },
      { property: "og:description", content: "Live academic reporting across the institution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicReportsPage,
});

interface ReportRow {
  label: string;
  [key: string]: string | number;
}

function ReportCard({
  title,
  description,
  columns,
  rows,
  exportName,
}: {
  title: string;
  description: string;
  columns: { key: string; header: string }[];
  rows: ReportRow[];
  exportName: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              exportName,
              columns.map((column) => column.header),
              rows.map((row) => columns.map((column) => String(row[column.key] ?? ""))),
            )
          }
        >
          <Download className="size-4" />
          CSV
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data recorded yet for this report.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{row[column.key] ?? "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AcademicReportsPage() {
  const { departments, programs, courses, faculty, sections, curricula } = useAcademicLookups();
  const workload = useFacultyWorkload();

  const students = useResourceList<{
    id: string;
    department_id: string | null;
    program_id: string | null;
    section_id: string | null;
  }>({
    table: "students",
    select: "id, department_id, program_id, section_id",
  });

  const enrollments = useResourceList<{ id: string; course_id: string; status: string }>({
    table: "enrollments",
    select: "id, course_id, status",
  });

  const departmentRows = useMemo<ReportRow[]>(
    () =>
      (departments.data ?? []).map((dept) => ({
        label: dept.name,
        department: dept.name,
        programmes: (programs.data ?? []).filter((p) => p.department_id === dept.id).length,
        subjects: (courses.data ?? []).filter((c) => c.department_id === dept.id).length,
        faculty: (faculty.data ?? []).filter((f) => f.department_id === dept.id).length,
        students: (students.data ?? []).filter((s) => s.department_id === dept.id).length,
      })),
    [departments.data, programs.data, courses.data, faculty.data, students.data],
  );

  const programmeRows = useMemo<ReportRow[]>(
    () =>
      (programs.data ?? []).map((program) => {
        const programCourses = (courses.data ?? []).filter((c) => c.program_id === program.id);
        return {
          label: program.name,
          programme: program.name,
          semesters: program.total_semesters,
          subjects: programCourses.length,
          credits: programCourses.reduce((sum, course) => sum + Number(course.credits ?? 0), 0),
          sections: (sections.data ?? []).filter((s) => s.program_id === program.id).length,
          students: (students.data ?? []).filter((s) => s.program_id === program.id).length,
        };
      }),
    [programs.data, courses.data, sections.data, students.data],
  );

  const enrollmentRows = useMemo<ReportRow[]>(() => {
    const map = new Map<string, number>();
    for (const row of enrollments.data ?? []) map.set(row.status, (map.get(row.status) ?? 0) + 1);
    return [...map.entries()].map(([status, count]) => ({
      label: status,
      status,
      enrolments: count,
    }));
  }, [enrollments.data]);

  const workloadRows = useMemo<ReportRow[]>(() => {
    const map = new Map<string, { hours: number; subjects: number }>();
    for (const row of workload.data ?? []) {
      if (!row.is_active) continue;
      const current = map.get(row.faculty_id) ?? { hours: 0, subjects: 0 };
      current.hours += Number(row.hours_per_week ?? 0);
      current.subjects += 1;
      map.set(row.faculty_id, current);
    }
    return [...map.entries()]
      .map(([id, value]) => {
        const member = faculty.data?.find((f) => f.id === id);
        return {
          label: member ? facultyName(member) : id,
          faculty: member ? facultyName(member) : "Unknown",
          subjects: value.subjects,
          hours: value.hours,
        };
      })
      .sort((a, b) => Number(b.hours) - Number(a.hours));
  }, [workload.data, faculty.data]);

  const curriculumRows = useMemo<ReportRow[]>(
    () =>
      (curricula.data ?? []).map((row) => ({
        label: `${row.name} v${row.version}`,
        curriculum: `${row.name} v${row.version}`,
        programme: programs.data?.find((p) => p.id === row.program_id)?.name ?? "—",
        status: row.status,
      })),
    [curricula.data, programs.data],
  );

  return (
    <>
      <PageHeader
        title="Academic reports"
        description="Institution-wide academic reporting built directly on live records — export any report as CSV."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Reports" }]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportCard
          title="Department report"
          description="Programmes, subjects, faculty and students per department."
          exportName="department-report"
          columns={[
            { key: "department", header: "Department" },
            { key: "programmes", header: "Programmes" },
            { key: "subjects", header: "Subjects" },
            { key: "faculty", header: "Faculty" },
            { key: "students", header: "Students" },
          ]}
          rows={departmentRows}
        />

        <ReportCard
          title="Programme report"
          description="Structure, credit load, sections and student distribution per programme."
          exportName="programme-report"
          columns={[
            { key: "programme", header: "Programme" },
            { key: "semesters", header: "Semesters" },
            { key: "subjects", header: "Subjects" },
            { key: "credits", header: "Credits" },
            { key: "sections", header: "Sections" },
            { key: "students", header: "Students" },
          ]}
          rows={programmeRows}
        />

        <ReportCard
          title="Enrolment report"
          description="Subject enrolments grouped by status."
          exportName="enrolment-report"
          columns={[
            { key: "status", header: "Status" },
            { key: "enrolments", header: "Enrolments" },
          ]}
          rows={enrollmentRows}
        />

        <ReportCard
          title="Faculty workload report"
          description="Active weekly teaching hours and subject count per faculty member."
          exportName="faculty-workload-report"
          columns={[
            { key: "faculty", header: "Faculty" },
            { key: "subjects", header: "Subjects" },
            { key: "hours", header: "Hours/week" },
          ]}
          rows={workloadRows}
        />

        <ReportCard
          title="Curriculum report"
          description="Every curriculum version and its approval status."
          exportName="curriculum-report"
          columns={[
            { key: "curriculum", header: "Curriculum" },
            { key: "programme", header: "Programme" },
            { key: "status", header: "Status" },
          ]}
          rows={curriculumRows}
        />
      </div>
    </>
  );
}
