import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
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
import { useAccess } from "@/hooks/useAccess";
import { useStudentLookups, useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv } from "@/lib/export";
import { humanise, profileCompletion, studentName, type StudentRecord } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/reports")({
  head: () => ({
    meta: [
      { title: "Student reports — CampusOS" },
      {
        name: "description",
        content:
          "Student register analytics: department, programme, gender, category, campus and admission statistics.",
      },
      { property: "og:title", content: "Student reports — CampusOS" },
      {
        property: "og:description",
        content: "Register analytics across departments, programmes and cohorts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentReportsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Reports unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface Bucket {
  label: string;
  count: number;
}

function tally(rows: StudentRecord[], resolve: (row: StudentRecord) => string): Bucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = resolve(row) || "Unspecified";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function BreakdownCard({
  title,
  description,
  buckets,
  total,
}: {
  title: string;
  description: string;
  buckets: Bucket[];
  total: number;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadCsv(
              `students-${title.toLowerCase().replace(/\s+/g, "-")}`,
              ["Group", "Students", "Share %"],
              buckets.map((bucket) => [
                bucket.label,
                bucket.count,
                total ? ((bucket.count / total) * 100).toFixed(1) : "0",
              ]),
            )
          }
        >
          <Download className="size-4" />
          CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!buckets.length ? <p className="text-sm text-muted-foreground">No data yet.</p> : null}
        {buckets.map((bucket) => (
          <div key={bucket.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate pr-3">{bucket.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {bucket.count} · {total ? Math.round((bucket.count / total) * 100) : 0}%
              </span>
            </div>
            <Progress value={total ? (bucket.count / total) * 100 : 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StudentReportsPage() {
  const { campuses } = useAccess();
  const register = useStudentRegister();
  const lookups = useStudentLookups();

  const rows = useMemo(() => register.data ?? [], [register.data]);

  const name = (list: { id: string; name: string }[] | undefined, id: string | null) =>
    list?.find((item) => item.id === id)?.name ?? "";
  const master = (list: { id: string; label: string }[] | undefined, id: string | null) =>
    list?.find((item) => item.id === id)?.label ?? "";

  const byDepartment = tally(rows, (row) => name(lookups.data?.departments, row.department_id));
  const byProgram = tally(rows, (row) => name(lookups.data?.programs, row.program_id));
  const byGender = tally(rows, (row) => humanise(row.gender) ?? "");
  const byCategory = tally(rows, (row) => master(lookups.data?.categories, row.category_id));
  const byCampus = tally(rows, (row) => campuses.find((c) => c.id === row.campus_id)?.name ?? "");
  const byStatus = tally(rows, (row) => humanise(row.status) ?? "");
  const byYear = tally(rows, (row) => name(lookups.data?.years, row.academic_year_id));
  const byAdmissionYear = tally(rows, (row) =>
    row.admission_date ? String(new Date(row.admission_date).getFullYear()) : "",
  );

  const completionAverage = rows.length
    ? Math.round(
        rows.reduce((total, row) => total + profileCompletion(row).percent, 0) / rows.length,
      )
    : 0;
  const incomplete = rows
    .map((row) => ({ row, completion: profileCompletion(row) }))
    .filter((item) => item.completion.percent < 70)
    .sort((a, b) => a.completion.percent - b.completion.percent)
    .slice(0, 12);

  if (register.error) {
    return (
      <ErrorState
        title="Could not load reports"
        description={(register.error as Error).message}
        onRetry={() => void register.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Student reports"
        description="Live register analytics for accreditation returns, reviews and leadership briefings."
        crumbs={[{ label: "People" }, { label: "Students", to: "/students" }, { label: "Reports" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "student-register",
                [
                  "Admission no",
                  "Registration no",
                  "Roll no",
                  "Name",
                  "Email",
                  "Phone",
                  "Gender",
                  "Status",
                  "Department",
                  "Programme",
                  "Campus",
                  "Admitted on",
                  "Profile completion %",
                ],
                rows.map((row) => [
                  row.admission_number,
                  row.registration_number,
                  row.roll_number,
                  studentName(row),
                  row.email,
                  row.phone,
                  row.gender,
                  row.status,
                  name(lookups.data?.departments, row.department_id),
                  name(lookups.data?.programs, row.program_id),
                  campuses.find((c) => c.id === row.campus_id)?.name ?? "",
                  row.admission_date,
                  profileCompletion(row).percent,
                ]),
              )
            }
          >
            <Download className="size-4" />
            Export register
          </Button>
        }
      />

      {register.isLoading ? <InlineLoader label="Building reports" /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students on register"
          value={rows.length}
          hint="Active, non-archived records"
        />
        <StatCard
          label="Enrolled"
          value={rows.filter((row) => row.status === "enrolled").length}
          hint="Currently studying"
        />
        <StatCard
          label="Applicants"
          value={rows.filter((row) => row.status === "applicant").length}
          hint="In the admissions pipeline"
        />
        <StatCard
          label="Average profile completion"
          value={`${completionAverage}%`}
          hint="Across the register"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Department wise"
          description="Headcount per academic department."
          buckets={byDepartment}
          total={rows.length}
        />
        <BreakdownCard
          title="Programme wise"
          description="Headcount per programme of study."
          buckets={byProgram}
          total={rows.length}
        />
        <BreakdownCard
          title="Gender"
          description="Diversity split for statutory returns."
          buckets={byGender}
          total={rows.length}
        />
        <BreakdownCard
          title="Category"
          description="Reservation category distribution."
          buckets={byCategory}
          total={rows.length}
        />
        <BreakdownCard
          title="Campus"
          description="Distribution across campuses."
          buckets={byCampus}
          total={rows.length}
        />
        <BreakdownCard
          title="Status"
          description="Lifecycle status of every record."
          buckets={byStatus}
          total={rows.length}
        />
        <BreakdownCard
          title="Academic year"
          description="Cohort by academic year."
          buckets={byYear}
          total={rows.length}
        />
        <BreakdownCard
          title="Admission statistics"
          description="Admissions by calendar year of joining."
          buckets={byAdmissionYear}
          total={rows.length}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Profile completion follow-up</CardTitle>
          <CardDescription>
            Records below 70% completion — chase these before accreditation submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!incomplete.length ? (
            <p className="text-sm text-muted-foreground">
              Every student profile is well populated.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Missing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomplete.map(({ row, completion }) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: row.id }}
                        className="font-medium hover:underline"
                      >
                        {studentName(row)}
                      </Link>
                    </TableCell>
                    <TableCell>{row.admission_number}</TableCell>
                    <TableCell className="tabular-nums">{completion.percent}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {completion.missing.slice(0, 3).join(", ")}
                      {completion.missing.length > 3 ? ` +${completion.missing.length - 3}` : ""}
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
