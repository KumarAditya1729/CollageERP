import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  facultyName,
  labelize,
  useAcademicLookups,
  useCourseCatalog,
  useCurriculumCourses,
  useCurriculumRecords,
  useEnrollmentRecords,
  useFacultyWorkload,
  useStudentRecords,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/programs/$programId")({
  head: () => ({
    meta: [
      { title: "Programme dashboard — CampusOS" },
      {
        name: "description",
        content:
          "Programme dashboard covering semester structure, curriculum versions, credits, enrolment, faculty and completion rate.",
      },
      { property: "og:title", content: "Programme dashboard — CampusOS" },
      {
        property: "og:description",
        content: "Semester structure, credits, enrolment and completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgramDashboard,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Programme not found.</div>
  ),
});

function ProgramDashboard() {
  const { programId } = Route.useParams();
  const { programs, semesters, sections, faculty, departments } = useAcademicLookups();
  const courses = useCourseCatalog();
  const curricula = useCurriculumRecords();
  const mappings = useCurriculumCourses();
  const students = useStudentRecords();
  const enrollments = useEnrollmentRecords();
  const allocations = useFacultyWorkload();

  const program = programs.data?.find((row) => row.id === programId) ?? null;
  const programSemesters = useMemo(
    () => (semesters.data ?? []).filter((row) => row.program_id === programId),
    [semesters.data, programId],
  );
  const programCourses = useMemo(
    () => (courses.data ?? []).filter((row) => row.program_id === programId),
    [courses.data, programId],
  );
  const programSections = useMemo(
    () => (sections.data ?? []).filter((row) => row.program_id === programId),
    [sections.data, programId],
  );
  const programStudents = useMemo(
    () => (students.data ?? []).filter((row) => row.program_id === programId),
    [students.data, programId],
  );
  const programCurricula = useMemo(
    () => (curricula.data ?? []).filter((row) => row.program_id === programId),
    [curricula.data, programId],
  );

  const activeCurriculum =
    programCurricula.find((row) => row.status === "active") ?? programCurricula[0] ?? null;
  const curriculumRows = useMemo(
    () => (mappings.data ?? []).filter((row) => row.curriculum_id === activeCurriculum?.id),
    [mappings.data, activeCurriculum?.id],
  );

  const creditsBySemester = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of curriculumRows) {
      const credits = Number(
        row.credits ?? courses.data?.find((c) => c.id === row.course_id)?.credits ?? 0,
      );
      map.set(row.semester_number, (map.get(row.semester_number) ?? 0) + credits);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [curriculumRows, courses.data]);

  const totalCredits = creditsBySemester.reduce((sum, [, credits]) => sum + credits, 0);

  const programEnrolments = useMemo(() => {
    const courseIds = new Set(programCourses.map((row) => row.id));
    return (enrollments.data ?? []).filter((row) => courseIds.has(row.course_id));
  }, [enrollments.data, programCourses]);

  const completionRate = programEnrolments.length
    ? Math.round(
        (programEnrolments.filter((row) => row.status === "completed").length /
          programEnrolments.length) *
          100,
      )
    : 0;

  const programFaculty = useMemo(() => {
    const courseIds = new Set(programCourses.map((row) => row.id));
    const map = new Map<string, number>();
    for (const row of allocations.data ?? []) {
      if (!row.is_active || !courseIds.has(row.course_id)) continue;
      map.set(row.faculty_id, (map.get(row.faculty_id) ?? 0) + Number(row.hours_per_week ?? 0));
    }
    return [...map.entries()]
      .map(([id, hours]) => {
        const member = faculty.data?.find((f) => f.id === id);
        return {
          id,
          name: member ? facultyName(member) : "Unknown faculty",
          department: departments.data?.find((d) => d.id === member?.department_id)?.name ?? "—",
          hours,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [allocations.data, programCourses, faculty.data, departments.data]);

  return (
    <>
      <PageHeader
        title={program?.name ?? "Programme"}
        description={
          program
            ? `${program.code ?? ""} · ${program.total_semesters} semesters`
            : "Loading programme…"
        }
        crumbs={[
          { label: "Academics", to: "/academics" },
          { label: "Programmes", to: "/programs" },
          { label: program?.name ?? "Programme" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={programStudents.length}
          hint={`${programSections.length} sections`}
        />
        <StatCard label="Subjects" value={programCourses.length} hint="Mapped to this programme" />
        <StatCard
          label="Curriculum credits"
          value={totalCredits}
          hint={
            activeCurriculum
              ? `${activeCurriculum.name} v${activeCurriculum.version}`
              : "No curriculum yet"
          }
        />
        <StatCard
          label="Completion rate"
          value={`${completionRate}%`}
          hint="Completed enrolments"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Semester structure</CardTitle>
            <CardDescription>
              Semesters defined for this programme and the credits carried by the active curriculum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programSemesters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No semesters defined — add them from Academic structure.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semester</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Curriculum credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programSemesters.map((semester) => (
                    <TableRow key={semester.id}>
                      <TableCell className="font-medium">{semester.name}</TableCell>
                      <TableCell>{semester.number}</TableCell>
                      <TableCell>
                        {creditsBySemester.find(([number]) => number === semester.number)?.[1] ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Curriculum versions</CardTitle>
            <CardDescription>
              Every version created for this programme and its approval state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programCurricula.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No curriculum yet —{" "}
                <Link to="/academics/curriculum" className="underline underline-offset-4">
                  create the first version
                </Link>
                .
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Effective from</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programCurricula.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.name} v{row.version}
                      </TableCell>
                      <TableCell>{row.regulation ?? "—"}</TableCell>
                      <TableCell>{row.effective_from ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "active" ? "default" : "secondary"}>
                          {labelize(row.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolment and completion</CardTitle>
          <CardDescription>
            {programEnrolments.length} enrolments recorded across this programme&apos;s subjects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={completionRate} />
          <div className="flex flex-wrap gap-2">
            {["registered", "active", "completed", "withdrawn", "failed"].map((status) => (
              <Badge key={status} variant="outline">
                {labelize(status)}:{" "}
                {programEnrolments.filter((row) => row.status === status).length}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faculty teaching this programme</CardTitle>
          <CardDescription>
            Active allocations against subjects belonging to this programme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No faculty allocated to this programme yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Weekly hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programFaculty.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.hours} h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
