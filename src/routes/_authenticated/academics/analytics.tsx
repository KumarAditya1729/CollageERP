import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
  useAcademicLookups,
  useCourseCatalog,
  useEnrollmentRecords,
  useFacultyWorkload,
  useStudentRecords,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/analytics")({
  head: () => ({
    meta: [
      { title: "Academic analytics — CampusOS" },
      {
        name: "description",
        content:
          "Enrolment trends, programme growth, department analytics, faculty load, credit distribution and student spread.",
      },
      { property: "og:title", content: "Academic analytics — CampusOS" },
      { property: "og:description", content: "Live analytics across the academic engine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicAnalyticsPage,
});

const chartConfig = {
  value: { label: "Count", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function AcademicAnalyticsPage() {
  const { departments, programs, faculty, sections } = useAcademicLookups();
  const courses = useCourseCatalog();
  const students = useStudentRecords();
  const enrollments = useEnrollmentRecords();
  const allocations = useFacultyWorkload();

  const enrollmentTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of enrollments.data ?? []) {
      if (!row.enrolled_at) continue;
      const key = monthKey(row.enrolled_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([label, value]) => ({ label, value }));
  }, [enrollments.data]);

  const admissionTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of students.data ?? []) {
      if (!row.created_at) continue;
      const key = monthKey(row.created_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([label, value]) => ({ label, value }));
  }, [students.data]);

  const programmeGrowth = useMemo(
    () =>
      (programs.data ?? [])
        .map((program) => ({
          label: program.code ?? program.name,
          name: program.name,
          value: (students.data ?? []).filter((s) => s.program_id === program.id).length,
          subjects: (courses.data ?? []).filter((c) => c.program_id === program.id).length,
          sections: (sections.data ?? []).filter((s) => s.program_id === program.id).length,
        }))
        .sort((a, b) => b.value - a.value),
    [programs.data, students.data, courses.data, sections.data],
  );

  const departmentAnalytics = useMemo(
    () =>
      (departments.data ?? []).map((department) => {
        const facultyIds = (faculty.data ?? [])
          .filter((f) => f.department_id === department.id)
          .map((f) => f.id);
        const hours = (allocations.data ?? [])
          .filter((row) => row.is_active && facultyIds.includes(row.faculty_id))
          .reduce((sum, row) => sum + Number(row.hours_per_week ?? 0), 0);
        return {
          id: department.id,
          label: department.code ?? department.name,
          name: department.name,
          students: (students.data ?? []).filter((s) => s.department_id === department.id).length,
          faculty: facultyIds.length,
          subjects: (courses.data ?? []).filter((c) => c.department_id === department.id).length,
          hours,
          ratio: facultyIds.length
            ? Math.round(
                ((students.data ?? []).filter((s) => s.department_id === department.id).length /
                  facultyIds.length) *
                  10,
              ) / 10
            : 0,
        };
      }),
    [departments.data, faculty.data, allocations.data, students.data, courses.data],
  );

  const facultyLoad = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of allocations.data ?? []) {
      if (!row.is_active) continue;
      map.set(row.faculty_id, (map.get(row.faculty_id) ?? 0) + Number(row.hours_per_week ?? 0));
    }
    return [...map.entries()]
      .map(([id, hours]) => {
        const member = faculty.data?.find((f) => f.id === id);
        return { label: member ? facultyName(member) : "Unknown", value: hours };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [allocations.data, faculty.data]);

  const creditDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of courses.data ?? []) {
      const key = `${Number(course.credits ?? 0)} credits`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([label, value]) => ({ label, value }));
  }, [courses.data]);

  const studentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const student of students.data ?? [])
      map.set(student.status, (map.get(student.status) ?? 0) + 1);
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [students.data]);

  const totalCredits = (courses.data ?? []).reduce(
    (sum, course) => sum + Number(course.credits ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Academic analytics"
        description="Trends and distributions computed live from admissions, enrolment, curriculum and allocation records."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={students.data?.length ?? 0}
          hint="On record in this organisation"
        />
        <StatCard
          label="Enrolments"
          value={enrollments.data?.length ?? 0}
          hint="Subject registrations"
        />
        <StatCard label="Catalogue credits" value={totalCredits} hint="Across every subject" />
        <StatCard
          label="Weekly teaching hours"
          value={(allocations.data ?? [])
            .filter((row) => row.is_active)
            .reduce((sum, row) => sum + Number(row.hours_per_week ?? 0), 0)}
          hint="Active allocations"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrolment trend</CardTitle>
            <CardDescription>
              Subject registrations per month, last twelve months with activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolments recorded yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={enrollmentTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admission trend</CardTitle>
            <CardDescription>New student records created per month.</CardDescription>
          </CardHeader>
          <CardContent>
            {admissionTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student records yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={admissionTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programme growth</CardTitle>
            <CardDescription>
              Students per programme, with subject and section counts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programmeGrowth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No programmes defined yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={programmeGrowth}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faculty load</CardTitle>
            <CardDescription>Top ten faculty members by active weekly hours.</CardDescription>
          </CardHeader>
          <CardContent>
            {facultyLoad.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active allocations yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={facultyLoad} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit distribution</CardTitle>
            <CardDescription>How many subjects sit at each credit weight.</CardDescription>
          </CardHeader>
          <CardContent>
            {creditDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects in the catalogue yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={creditDistribution}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student distribution</CardTitle>
            <CardDescription>Students grouped by lifecycle status.</CardDescription>
          </CardHeader>
          <CardContent>
            {studentDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students on record yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={studentDistribution}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department analytics</CardTitle>
          <CardDescription>
            Students, faculty, subjects, teaching hours and student–faculty ratio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departmentAnalytics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments defined yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Weekly hours</TableHead>
                  <TableHead>Student : faculty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentAnalytics.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.students}</TableCell>
                    <TableCell>{row.faculty}</TableCell>
                    <TableCell>{row.subjects}</TableCell>
                    <TableCell>{row.hours}</TableCell>
                    <TableCell>{row.ratio ? `${row.ratio} : 1` : "—"}</TableCell>
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
