import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MAX_WEEKLY_HOURS,
  facultyName,
  labelize,
  useAcademicConflicts,
  useAcademicLookups,
  useCourseCatalog,
  useFacultyWorkload,
  workloadKind,
  type WorkloadKind,
} from "@/hooks/useAcademics";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/workload")({
  head: () => ({
    meta: [
      { title: "Faculty workload — CampusOS" },
      {
        name: "description",
        content:
          "Weekly and semester teaching load split across theory, lab, tutorial and project hours, with conflict detection.",
      },
      { property: "og:title", content: "Faculty workload — CampusOS" },
      {
        property: "og:description",
        content: "Teaching hours, weekly load and conflict detection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkloadPage,
});

const kinds: WorkloadKind[] = ["theory", "lab", "tutorial", "project"];

function WorkloadPage() {
  const { faculty, departments, semesters } = useAcademicLookups();
  const courses = useCourseCatalog();
  const allocations = useFacultyWorkload();
  const { conflicts, loading: conflictsLoading } = useAcademicConflicts();

  const [semesterId, setSemesterId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");

  const rows = useMemo(() => {
    const map = new Map<
      string,
      {
        hours: number;
        subjects: number;
        theory: number;
        lab: number;
        tutorial: number;
        project: number;
      }
    >();

    for (const allocation of allocations.data ?? []) {
      if (!allocation.is_active) continue;
      if (semesterId !== "all" && allocation.semester_id !== semesterId) continue;
      const member = faculty.data?.find((f) => f.id === allocation.faculty_id);
      if (departmentId !== "all" && member?.department_id !== departmentId) continue;

      const course = courses.data?.find((c) => c.id === allocation.course_id);
      const kind = workloadKind(allocation.role, course);
      const hours = Number(allocation.hours_per_week ?? 0);
      const current = map.get(allocation.faculty_id) ?? {
        hours: 0,
        subjects: 0,
        theory: 0,
        lab: 0,
        tutorial: 0,
        project: 0,
      };
      current.hours += hours;
      current.subjects += 1;
      current[kind] += hours;
      map.set(allocation.faculty_id, current);
    }

    return [...map.entries()]
      .map(([id, value]) => {
        const member = faculty.data?.find((f) => f.id === id);
        return {
          id,
          name: member ? facultyName(member) : "Unknown faculty",
          department: departments.data?.find((d) => d.id === member?.department_id)?.name ?? "—",
          ...value,
          semesterHours: value.hours * 15,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [allocations.data, courses.data, faculty.data, departments.data, semesterId, departmentId]);

  const totals = useMemo(() => {
    const base = { hours: 0, theory: 0, lab: 0, tutorial: 0, project: 0 };
    for (const row of rows) {
      base.hours += row.hours;
      base.theory += row.theory;
      base.lab += row.lab;
      base.tutorial += row.tutorial;
      base.project += row.project;
    }
    return base;
  }, [rows]);

  const overloaded = rows.filter((row) => row.hours > MAX_WEEKLY_HOURS).length;
  const average = rows.length ? Math.round((totals.hours / rows.length) * 10) / 10 : 0;

  return (
    <>
      <PageHeader
        title="Faculty workload"
        description={`Teaching hours per faculty member split by delivery mode, measured against a ${MAX_WEEKLY_HOURS} hour weekly ceiling.`}
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Workload" }]}
        actions={
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                "faculty-workload",
                [
                  "Faculty",
                  "Department",
                  "Subjects",
                  "Theory",
                  "Lab",
                  "Tutorial",
                  "Project",
                  "Weekly",
                  "Semester",
                ],
                rows.map((row) => [
                  row.name,
                  row.department,
                  row.subjects,
                  row.theory,
                  row.lab,
                  row.tutorial,
                  row.project,
                  row.hours,
                  row.semesterHours,
                ]),
              )
            }
          >
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faculty with load"
          value={rows.length}
          hint="Active allocations in scope"
        />
        <StatCard label="Weekly hours" value={totals.hours} hint="Across all allocations" />
        <StatCard label="Average load" value={`${average} h`} hint="Per faculty member each week" />
        <StatCard
          label="Overloaded"
          value={overloaded}
          hint={`Above ${MAX_WEEKLY_HOURS} hours per week`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={semesterId} onValueChange={setSemesterId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {(semesters.data ?? []).map((row) => (
              <SelectItem key={row.id} value={row.id}>
                {row.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {(departments.data ?? []).map((row) => (
              <SelectItem key={row.id} value={row.id}>
                {row.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="load">
        <TabsList>
          <TabsTrigger value="load">Teaching load</TabsTrigger>
          <TabsTrigger value="mix">Delivery mix</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts ({conflicts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="load" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly and semester load</CardTitle>
              <CardDescription>
                Semester hours assume a fifteen week teaching term for each weekly contact hour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active allocations match this filter. Assign faculty from the allocation
                  screen.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Weekly</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead className="w-48">Utilisation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.subjects}</TableCell>
                        <TableCell>
                          <span
                            className={
                              row.hours > MAX_WEEKLY_HOURS ? "text-destructive" : undefined
                            }
                          >
                            {row.hours} h
                          </span>
                        </TableCell>
                        <TableCell>{row.semesterHours} h</TableCell>
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
        </TabsContent>

        <TabsContent value="mix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Theory, lab, tutorial and project hours</CardTitle>
              <CardDescription>
                Hours are classified from the allocation role and the subject&apos;s L-T-P
                structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                {kinds.map((kind) => (
                  <div key={kind} className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {labelize(kind)}
                    </p>
                    <p className="text-2xl font-semibold">{totals[kind]} h</p>
                  </div>
                ))}
              </div>
              {rows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      {kinds.map((kind) => (
                        <TableHead key={kind}>{labelize(kind)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        {kinds.map((kind) => (
                          <TableCell key={kind}>{row[kind]} h</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflict detection</CardTitle>
              <CardDescription>
                Faculty, section, room and period conflicts detected from live allocation and
                infrastructure data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conflictsLoading ? (
                <p className="text-sm text-muted-foreground">Checking allocations…</p>
              ) : conflicts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No conflicts detected — allocations, sections, rooms and periods are consistent.
                </p>
              ) : (
                conflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <AlertTriangle
                      className={`mt-0.5 size-4 ${conflict.severity === "high" ? "text-destructive" : "text-muted-foreground"}`}
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{conflict.title}</p>
                        <Badge variant="outline">{labelize(conflict.kind)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{conflict.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
