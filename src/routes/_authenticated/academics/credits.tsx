import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  labelize,
  studentLabel,
  useAcademicLookups,
  useCourseCatalog,
  useCurriculumCourses,
  useCurriculumRecords,
  useEnrollmentRecords,
  usePrerequisites,
  useStudentRecords,
} from "@/hooks/useAcademics";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/credits")({
  head: () => ({
    meta: [
      { title: "Credit engine — CampusOS" },
      {
        name: "description",
        content:
          "CBCS and NEP credit rules, curriculum credit validation, prerequisites, co-requisites, eligibility checks and credits earned.",
      },
      { property: "og:title", content: "Credit engine — CampusOS" },
      { property: "og:description", content: "Credit rules, validation and eligibility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreditEnginePage,
});

/** Regulation bands applied when validating a curriculum's credit structure. */
const creditRules = {
  CBCS: { minSemester: 16, maxSemester: 28, label: "CBCS" },
  NEP: { minSemester: 18, maxSemester: 30, label: "NEP 2020" },
  DEFAULT: { minSemester: 14, maxSemester: 32, label: "Institutional default" },
};

function ruleFor(regulation: string | null) {
  const value = (regulation ?? "").toUpperCase();
  if (value.includes("NEP")) return creditRules.NEP;
  if (value.includes("CBCS")) return creditRules.CBCS;
  return creditRules.DEFAULT;
}

function CreditEnginePage() {
  const { programs } = useAcademicLookups();
  const curricula = useCurriculumRecords();
  const mappings = useCurriculumCourses();
  const courses = useCourseCatalog();
  const prerequisites = usePrerequisites();
  const enrollments = useEnrollmentRecords();
  const students = useStudentRecords();

  const courseById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course])),
    [courses.data],
  );

  const validation = useMemo(() => {
    return (curricula.data ?? []).map((curriculum) => {
      const rule = ruleFor(curriculum.regulation);
      const rows = (mappings.data ?? []).filter((row) => row.curriculum_id === curriculum.id);
      const perSemester = new Map<number, number>();
      let mapped = 0;
      for (const row of rows) {
        const credits = Number(row.credits ?? courseById.get(row.course_id)?.credits ?? 0);
        mapped += credits;
        perSemester.set(row.semester_number, (perSemester.get(row.semester_number) ?? 0) + credits);
      }
      const breaches = [...perSemester.entries()]
        .filter(([, credits]) => credits < rule.minSemester || credits > rule.maxSemester)
        .map(([semester, credits]) => `Semester ${semester}: ${credits} credits`);
      const planned = Number(curriculum.total_credits ?? 0);
      const matchesPlan = planned === 0 || planned === mapped;

      return {
        id: curriculum.id,
        name: `${curriculum.name} v${curriculum.version}`,
        programme: programs.data?.find((p) => p.id === curriculum.program_id)?.name ?? "—",
        regulation: rule.label,
        band: `${rule.minSemester}–${rule.maxSemester}`,
        subjects: rows.length,
        mapped,
        planned,
        matchesPlan,
        breaches,
        valid: matchesPlan && breaches.length === 0 && rows.length > 0,
        status: curriculum.status,
      };
    });
  }, [curricula.data, mappings.data, courseById, programs.data]);

  const prereqRows = useMemo(
    () =>
      (prerequisites.data ?? []).map((row) => ({
        id: row.id,
        subject: courseById.get(row.course_id),
        required: courseById.get(row.prerequisite_course_id),
        kind: row.kind,
      })),
    [prerequisites.data, courseById],
  );

  const eligibility = useMemo(() => {
    const completed = new Set(
      (enrollments.data ?? [])
        .filter((row) => row.status === "completed")
        .map((row) => `${row.student_id}|${row.course_id}`),
    );
    const issues: {
      id: string;
      student: string;
      subject: string;
      missing: string;
      kind: string;
    }[] = [];

    for (const enrollment of enrollments.data ?? []) {
      if (enrollment.status === "withdrawn" || enrollment.status === "completed") continue;
      const required = (prerequisites.data ?? []).filter(
        (row) => row.course_id === enrollment.course_id,
      );
      for (const requirement of required) {
        if (requirement.kind === "corequisite") {
          const takenTogether = (enrollments.data ?? []).some(
            (row) =>
              row.student_id === enrollment.student_id &&
              row.course_id === requirement.prerequisite_course_id &&
              row.semester_id === enrollment.semester_id,
          );
          if (takenTogether) continue;
        } else if (
          completed.has(`${enrollment.student_id}|${requirement.prerequisite_course_id}`)
        ) {
          continue;
        }
        const student = students.data?.find((row) => row.id === enrollment.student_id);
        issues.push({
          id: `${enrollment.id}-${requirement.id}`,
          student: student ? studentLabel(student) : "Unknown student",
          subject: courseById.get(enrollment.course_id)?.code ?? "—",
          missing: courseById.get(requirement.prerequisite_course_id)?.code ?? "—",
          kind: requirement.kind,
        });
      }
    }
    return issues;
  }, [enrollments.data, prerequisites.data, students.data, courseById]);

  const earned = useMemo(() => {
    const map = new Map<string, { credits: number; subjects: number }>();
    for (const row of enrollments.data ?? []) {
      if (row.status !== "completed") continue;
      const credits = Number(courseById.get(row.course_id)?.credits ?? 0);
      const current = map.get(row.student_id) ?? { credits: 0, subjects: 0 };
      current.credits += credits;
      current.subjects += 1;
      map.set(row.student_id, current);
    }
    return [...map.entries()]
      .map(([id, value]) => {
        const student = students.data?.find((row) => row.id === id);
        return {
          id,
          name: student ? studentLabel(student) : "Unknown student",
          roll: student?.roll_number ?? "—",
          programme: programs.data?.find((p) => p.id === student?.program_id)?.name ?? "—",
          ...value,
        };
      })
      .sort((a, b) => b.credits - a.credits);
  }, [enrollments.data, students.data, programs.data, courseById]);

  const validCount = validation.filter((row) => row.valid).length;

  return (
    <>
      <PageHeader
        title="Credit engine"
        description="Credit rules for CBCS and NEP regulations, curriculum validation, prerequisite and co-requisite enforcement, and credits earned."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Credit engine" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Curricula validated"
          value={`${validCount}/${validation.length}`}
          hint="Pass all credit rules"
        />
        <StatCard
          label="Prerequisite links"
          value={prereqRows.length}
          hint="Pre and co-requisites defined"
        />
        <StatCard
          label="Eligibility issues"
          value={eligibility.length}
          hint="Enrolments missing a requirement"
        />
        <StatCard
          label="Students with credits"
          value={earned.length}
          hint="Completed subjects on record"
        />
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Credit rules</TabsTrigger>
          <TabsTrigger value="requisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="transfer">Credits earned</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulation bands</CardTitle>
              <CardDescription>
                Each curriculum is validated against the semester credit band for its regulation,
                and against its own planned credit total.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {Object.values(creditRules).map((rule) => (
                <div key={rule.label} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{rule.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {rule.minSemester}–{rule.maxSemester} credits per semester
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle>Curriculum credit validation</CardTitle>
                <CardDescription>
                  Mapped credits versus planned credits, with per-semester breaches.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={validation.length === 0}
                onClick={() =>
                  downloadCsv(
                    "credit-validation",
                    [
                      "Curriculum",
                      "Programme",
                      "Regulation",
                      "Subjects",
                      "Mapped",
                      "Planned",
                      "Valid",
                      "Breaches",
                    ],
                    validation.map((row) => [
                      row.name,
                      row.programme,
                      row.regulation,
                      row.subjects,
                      row.mapped,
                      row.planned,
                      row.valid ? "Yes" : "No",
                      row.breaches.join("; "),
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {validation.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No curriculum versions yet — create one from the curriculum screen.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curriculum</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Regulation</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Mapped</TableHead>
                      <TableHead>Planned</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.programme}</TableCell>
                        <TableCell>
                          {row.regulation}
                          <span className="ml-1 text-muted-foreground">({row.band})</span>
                        </TableCell>
                        <TableCell>{row.subjects}</TableCell>
                        <TableCell>{row.mapped}</TableCell>
                        <TableCell>{row.planned || "—"}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="size-4" /> Valid
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                                <XCircle className="size-4" />
                                {row.subjects === 0
                                  ? "No subjects mapped"
                                  : !row.matchesPlan
                                    ? "Mapped credits differ from plan"
                                    : "Semester band breached"}
                              </span>
                              {row.breaches.map((breach) => (
                                <p key={breach} className="text-xs text-muted-foreground">
                                  {breach}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites and co-requisites</CardTitle>
              <CardDescription>
                Defined on each subject — open a subject from the subjects screen to add or remove
                links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prereqRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requisite links defined yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Requires</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prereqRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.subject ? `${row.subject.code} — ${row.subject.title}` : "—"}
                        </TableCell>
                        <TableCell>
                          {row.required ? `${row.required.code} — ${row.required.title}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{labelize(row.kind)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eligibility" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility checks</CardTitle>
              <CardDescription>
                Active enrolments where the student has not completed a prerequisite, or is not
                taking a co-requisite in the same semester.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eligibility.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Every active enrolment satisfies its requisite rules.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrolled subject</TableHead>
                      <TableHead>Missing</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibility.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.student}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.missing}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{labelize(row.kind)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle>Credits earned</CardTitle>
                <CardDescription>
                  Completed subjects converted into credits — the basis for credit transfer and
                  programme completion.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={earned.length === 0}
                onClick={() =>
                  downloadCsv(
                    "credits-earned",
                    ["Student", "Roll number", "Programme", "Subjects", "Credits"],
                    earned.map((row) => [
                      row.name,
                      row.roll,
                      row.programme,
                      row.subjects,
                      row.credits,
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {earned.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed enrolments yet, so no credits have been earned.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll number</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earned.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.roll}</TableCell>
                        <TableCell>{row.programme}</TableCell>
                        <TableCell>{row.subjects}</TableCell>
                        <TableCell>{row.credits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
