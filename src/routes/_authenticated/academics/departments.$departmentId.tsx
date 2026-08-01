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
  MAX_WEEKLY_HOURS,
  facultyName,
  useAcademicLookups,
  useCourseCatalog,
  useEnrollmentRecords,
  useFacultyWorkload,
  useStudentRecords,
} from "@/hooks/useAcademics";
import { useResourceList } from "@/hooks/useResource";

export const Route = createFileRoute("/_authenticated/academics/departments/$departmentId")({
  head: () => ({
    meta: [
      { title: "Department dashboard — CampusOS" },
      {
        name: "description",
        content:
          "Department profile with faculty and student counts, programmes, subjects, workload and enrolment analytics.",
      },
      { property: "og:title", content: "Department dashboard — CampusOS" },
      {
        property: "og:description",
        content: "Faculty, students, programmes and workload for a department.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepartmentDashboard,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Department not found.</div>
  ),
});

interface DepartmentDetail extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  vision: string | null;
  mission: string | null;
  hod_faculty_id: string | null;
  established_year: number | null;
  email: string | null;
  phone: string | null;
}

function DepartmentDashboard() {
  const { departmentId } = Route.useParams();
  const { programs } = useAcademicLookups();
  const facultyList = useAcademicLookups().faculty;
  const courses = useCourseCatalog();
  const students = useStudentRecords();
  const enrollments = useEnrollmentRecords();
  const allocations = useFacultyWorkload();

  const departments = useResourceList<DepartmentDetail>({
    table: "departments",
    select: "id, name, code, vision, mission, hod_faculty_id, established_year, email, phone",
    orderBy: { column: "name" },
  });

  const department = departments.data?.find((row) => row.id === departmentId) ?? null;

  const departmentFaculty = useMemo(
    () => (facultyList.data ?? []).filter((row) => row.department_id === departmentId),
    [facultyList.data, departmentId],
  );
  const departmentPrograms = useMemo(
    () => (programs.data ?? []).filter((row) => row.department_id === departmentId),
    [programs.data, departmentId],
  );
  const departmentCourses = useMemo(
    () => (courses.data ?? []).filter((row) => row.department_id === departmentId),
    [courses.data, departmentId],
  );
  const departmentStudents = useMemo(
    () => (students.data ?? []).filter((row) => row.department_id === departmentId),
    [students.data, departmentId],
  );

  const workload = useMemo(() => {
    const ids = new Set(departmentFaculty.map((row) => row.id));
    const map = new Map<string, { hours: number; subjects: number }>();
    for (const row of allocations.data ?? []) {
      if (!row.is_active || !ids.has(row.faculty_id)) continue;
      const current = map.get(row.faculty_id) ?? { hours: 0, subjects: 0 };
      current.hours += Number(row.hours_per_week ?? 0);
      current.subjects += 1;
      map.set(row.faculty_id, current);
    }
    return departmentFaculty
      .map((member) => ({
        id: member.id,
        name: facultyName(member),
        ...(map.get(member.id) ?? { hours: 0, subjects: 0 }),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [departmentFaculty, allocations.data]);

  const departmentEnrolments = useMemo(() => {
    const courseIds = new Set(departmentCourses.map((row) => row.id));
    const rows = (enrollments.data ?? []).filter((row) => courseIds.has(row.course_id));
    const byStatus = new Map<string, number>();
    for (const row of rows) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    return { total: rows.length, byStatus: [...byStatus.entries()] };
  }, [enrollments.data, departmentCourses]);

  const hod = facultyList.data?.find((row) => row.id === department?.hod_faculty_id);
  const totalHours = workload.reduce((sum, row) => sum + row.hours, 0);

  return (
    <>
      <PageHeader
        title={department?.name ?? "Department"}
        description={
          department
            ? `${department.code}${department.established_year ? ` · established ${department.established_year}` : ""}`
            : "Loading department…"
        }
        crumbs={[
          { label: "Academics", to: "/academics" },
          { label: "Departments", to: "/departments" },
          { label: department?.name ?? "Department" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faculty"
          value={departmentFaculty.length}
          hint={hod ? `HOD ${facultyName(hod)}` : "No HOD set"}
        />
        <StatCard
          label="Students"
          value={departmentStudents.length}
          hint="Mapped to this department"
        />
        <StatCard
          label="Programmes"
          value={departmentPrograms.length}
          hint="Offered by this department"
        />
        <StatCard label="Subjects" value={departmentCourses.length} hint="In the catalogue" />
      </div>

      {department?.vision || department?.mission ? (
        <Card>
          <CardHeader>
            <CardTitle>Vision and mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {department?.vision ? (
              <div>
                <p className="font-medium">Vision</p>
                <p className="text-muted-foreground">{department.vision}</p>
              </div>
            ) : null}
            {department?.mission ? (
              <div>
                <p className="font-medium">Mission</p>
                <p className="text-muted-foreground">{department.mission}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Programmes</CardTitle>
            <CardDescription>
              Programmes owned by this department and their student counts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentPrograms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No programmes mapped to this department.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programme</TableHead>
                    <TableHead>Semesters</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">
                        <Link
                          to="/academics/programs/$programId"
                          params={{ programId: program.id }}
                          className="underline-offset-4 hover:underline"
                        >
                          {program.name}
                        </Link>
                      </TableCell>
                      <TableCell>{program.total_semesters}</TableCell>
                      <TableCell>
                        {departmentStudents.filter((s) => s.program_id === program.id).length}
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
            <CardTitle>Enrolment</CardTitle>
            <CardDescription>
              {departmentEnrolments.total} enrolments across subjects owned by this department.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {departmentEnrolments.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No enrolments recorded for these subjects yet.
              </p>
            ) : (
              departmentEnrolments.byStatus.map(([status, count]) => (
                <Badge key={status} variant="outline">
                  {status}: {count}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty workload</CardTitle>
          <CardDescription>
            {totalHours} weekly hours across {departmentFaculty.length} faculty members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workload.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No faculty mapped to this department yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Weekly hours</TableHead>
                  <TableHead className="w-48">Utilisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workload.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.subjects}</TableCell>
                    <TableCell>{row.hours} h</TableCell>
                    <TableCell>
                      <Progress value={Math.min(100, (row.hours / MAX_WEEKLY_HOURS) * 100)} />
                    </TableCell>
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
