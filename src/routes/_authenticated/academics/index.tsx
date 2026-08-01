import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Layers,
  Library,
  Presentation,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  facultyName,
  labelize,
  useAcademicLookups,
  useAcademicOverview,
  useFacultyWorkload,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/")({
  head: () => ({
    meta: [
      { title: "Academic dashboard — CampusOS" },
      {
        name: "description",
        content:
          "Live view of departments, programmes, curricula, sections, faculty workload and infrastructure.",
      },
      { property: "og:title", content: "Academic dashboard — CampusOS" },
      { property: "og:description", content: "Academic backbone metrics for your college." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicDashboard,
});

const quickLinks = [
  { to: "/academics/structure", label: "Academic structure", icon: Layers },
  { to: "/academics/curriculum", label: "Curriculum", icon: Library },
  { to: "/academics/subjects", label: "Subjects", icon: BookOpen },
  { to: "/academics/allocations", label: "Faculty allocation", icon: Presentation },
  { to: "/academics/enrollment", label: "Enrolment", icon: GraduationCap },
  { to: "/academics/calendar", label: "Academic calendar", icon: CalendarDays },
  { to: "/academics/infrastructure", label: "Rooms & infrastructure", icon: Building2 },
  { to: "/academics/reports", label: "Academic reports", icon: Users },
] as const;

function AcademicDashboard() {
  const overview = useAcademicOverview();
  const { programs, curricula, courses, faculty, departments } = useAcademicLookups();
  const workload = useFacultyWorkload();

  const counts = overview.data ?? {};

  const curriculumByStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of curricula.data ?? []) map.set(row.status, (map.get(row.status) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [curricula.data]);

  const loadByFaculty = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of workload.data ?? []) {
      if (!row.is_active) continue;
      map.set(row.faculty_id, (map.get(row.faculty_id) ?? 0) + Number(row.hours_per_week ?? 0));
    }
    const rows = [...map.entries()]
      .map(([facultyId, hours]) => {
        const member = faculty.data?.find((f) => f.id === facultyId);
        return { id: facultyId, name: member ? facultyName(member) : "Unknown faculty", hours };
      })
      .sort((a, b) => b.hours - a.hours);
    return rows.slice(0, 8);
  }, [workload.data, faculty.data]);

  const maxLoad = Math.max(1, ...loadByFaculty.map((row) => row.hours));

  const creditsByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of courses.data ?? []) {
      if (!course.department_id) continue;
      map.set(
        course.department_id,
        (map.get(course.department_id) ?? 0) + Number(course.credits ?? 0),
      );
    }
    return [...map.entries()]
      .map(([id, credits]) => ({
        id,
        name: departments.data?.find((d) => d.id === id)?.name ?? "Unassigned",
        credits,
      }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 8);
  }, [courses.data, departments.data]);

  const maxCredits = Math.max(1, ...creditsByDepartment.map((row) => row.credits));

  return (
    <>
      <PageHeader
        title="Academic management"
        description="The academic backbone — structure, curriculum, subjects, allocation, enrolment and infrastructure."
        crumbs={[{ label: "Academics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Departments"
          value={counts.departments ?? 0}
          icon={Building2}
          loading={overview.isLoading}
        />
        <StatCard
          label="Programmes"
          value={counts.programs ?? 0}
          icon={Library}
          loading={overview.isLoading}
        />
        <StatCard
          label="Subjects"
          value={counts.courses ?? 0}
          icon={BookOpen}
          loading={overview.isLoading}
        />
        <StatCard
          label="Curricula"
          value={counts.curricula ?? 0}
          icon={Layers}
          loading={overview.isLoading}
        />
        <StatCard
          label="Sections"
          value={counts.sections ?? 0}
          icon={Users}
          loading={overview.isLoading}
        />
        <StatCard
          label="Batches"
          value={counts.batches ?? 0}
          icon={GraduationCap}
          loading={overview.isLoading}
        />
        <StatCard
          label="Faculty allocations"
          value={counts.allocations ?? 0}
          icon={Presentation}
          loading={overview.isLoading}
        />
        <StatCard
          label="Rooms"
          value={counts.rooms ?? 0}
          icon={Building2}
          loading={overview.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teaching load</CardTitle>
            <CardDescription>Active weekly hours allocated per faculty member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadByFaculty.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active allocations yet. Assign faculty to subjects to see workload here.
              </p>
            ) : (
              loadByFaculty.map((row) => (
                <div key={row.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground">{row.hours} h/week</span>
                  </div>
                  <Progress value={(row.hours / maxLoad) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit load by department</CardTitle>
            <CardDescription>Total subject credits owned by each department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditsByDepartment.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add subjects with credits to see this breakdown.
              </p>
            ) : (
              creditsByDepartment.map((row) => (
                <div key={row.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground">{row.credits} credits</span>
                  </div>
                  <Progress value={(row.credits / maxCredits) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Curriculum status</CardTitle>
            <CardDescription>Where each curriculum version stands.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {curriculumByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No curriculum versions created yet.</p>
            ) : (
              curriculumByStatus.map(([status, count]) => (
                <Badge key={status} variant={status === "active" ? "default" : "secondary"}>
                  {labelize(status)} · {count}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jump to</CardTitle>
            <CardDescription>Every academic surface in one place.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <link.icon className="size-4 text-muted-foreground" aria-hidden />
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        {programs.data?.length ?? 0} programmes are configured across {counts.departments ?? 0}{" "}
        departments, with {counts.enrollments ?? 0} subject enrolments recorded.
      </p>
    </>
  );
}
