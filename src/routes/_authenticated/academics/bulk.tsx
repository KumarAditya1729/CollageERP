import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import {
  allocationRoles,
  curriculumCategories,
  facultyName,
  labelize,
  useAcademicLookups,
  useCourseCatalog,
  useCurriculumCourses,
  useCurriculumRecords,
} from "@/hooks/useAcademics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/bulk")({
  head: () => ({
    meta: [
      { title: "Academic bulk operations — CampusOS" },
      {
        name: "description",
        content:
          "Bulk subject import, bulk faculty allocation, bulk curriculum updates and bulk export of academic records.",
      },
      { property: "og:title", content: "Academic bulk operations — CampusOS" },
      { property: "og:description", content: "Import, allocate, update and export in bulk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BulkOperationsPage,
});

const SUBJECT_TEMPLATE = "code,title,type,credits,lecture_hours,tutorial_hours,practical_hours";

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [] as string[], rows: [] as Record<string, string>[] };
  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
  return { headers, rows };
}

function BulkOperationsPage() {
  const { tenant, can } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { departments, programs, semesters, sections, faculty, academicSessions } =
    useAcademicLookups();
  const courses = useCourseCatalog();
  const curricula = useCurriculumRecords();
  const mappings = useCurriculumCourses();

  const canManageCourses = can("course.manage");
  const canAllocate = can("faculty.assign");
  const canManageCurriculum = can("curriculum.manage");

  // Bulk subject import ------------------------------------------------
  const [csv, setCsv] = useState("");
  const [importDepartment, setImportDepartment] = useState("");
  const [importProgram, setImportProgram] = useState("");
  const parsed = useMemo(() => parseCsv(csv), [csv]);

  const importSubjects = useMutation({
    mutationFn: async () => {
      if (parsed.rows.length === 0) throw new Error("Paste or upload CSV rows first");
      const existing = new Set((courses.data ?? []).map((row) => row.code.toLowerCase()));
      const payload = parsed.rows
        .filter((row) => row.code && row.title && !existing.has(row.code.toLowerCase()))
        .map((row) => ({
          tenant_id: tenant?.id,
          code: row.code,
          title: row.title,
          type: row.type || "core",
          credits: row.credits ? Number(row.credits) : null,
          lecture_hours: row.lecture_hours ? Number(row.lecture_hours) : null,
          tutorial_hours: row.tutorial_hours ? Number(row.tutorial_hours) : null,
          practical_hours: row.practical_hours ? Number(row.practical_hours) : null,
          department_id: importDepartment || null,
          program_id: importProgram || null,
          created_by: user?.id,
        }));
      if (payload.length === 0) throw new Error("No new subjects to import — codes already exist");
      const { error } = await supabase.from("courses" as never).insert(payload as never);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} subjects imported`);
      setCsv("");
      void queryClient.invalidateQueries({ queryKey: ["resource", "courses"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Bulk faculty allocation --------------------------------------------
  const [allocFaculty, setAllocFaculty] = useState("");
  const [allocSection, setAllocSection] = useState("");
  const [allocSemester, setAllocSemester] = useState("");
  const [allocSession, setAllocSession] = useState("");
  const [allocRole, setAllocRole] = useState<string>("lead");
  const [allocHours, setAllocHours] = useState("3");
  const [allocCourses, setAllocCourses] = useState<string[]>([]);

  const allocate = useMutation({
    mutationFn: async () => {
      if (!allocFaculty) throw new Error("Choose a faculty member");
      if (allocCourses.length === 0) throw new Error("Select at least one subject");
      const payload = allocCourses.map((courseId) => ({
        tenant_id: tenant?.id,
        faculty_id: allocFaculty,
        course_id: courseId,
        section_id: allocSection || null,
        semester_id: allocSemester || null,
        academic_session_id: allocSession || null,
        role: allocRole,
        hours_per_week: Number(allocHours || 0),
        is_active: true,
        created_by: user?.id,
      }));
      const { error } = await supabase
        .from("faculty_allocations" as never)
        .insert(payload as never);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} allocations created`);
      setAllocCourses([]);
      void queryClient.invalidateQueries({ queryKey: ["resource", "faculty_allocations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Bulk curriculum update ---------------------------------------------
  const [curriculumId, setCurriculumId] = useState("");
  const [updateSemester, setUpdateSemester] = useState("all");
  const [updateCategory, setUpdateCategory] = useState("");
  const [updateCredits, setUpdateCredits] = useState("");

  const targetRows = useMemo(
    () =>
      (mappings.data ?? []).filter(
        (row) =>
          row.curriculum_id === curriculumId &&
          (updateSemester === "all" || String(row.semester_number) === updateSemester),
      ),
    [mappings.data, curriculumId, updateSemester],
  );

  const updateCurriculum = useMutation({
    mutationFn: async () => {
      if (!curriculumId) throw new Error("Choose a curriculum version");
      if (!updateCategory && !updateCredits)
        throw new Error("Set a category or credit value to apply");
      if (targetRows.length === 0) throw new Error("No mapped subjects match this selection");
      const values: Record<string, unknown> = { updated_by: user?.id };
      if (updateCategory) values.category = updateCategory;
      if (updateCredits) values.credits = Number(updateCredits);
      const { error } = await supabase
        .from("curriculum_courses" as never)
        .update(values as never)
        .in(
          "id",
          targetRows.map((row) => row.id),
        );
      if (error) throw error;
      return targetRows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} curriculum entries updated`);
      void queryClient.invalidateQueries({ queryKey: ["resource", "curriculum_courses"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const semesterNumbers = useMemo(
    () =>
      [
        ...new Set(
          (mappings.data ?? [])
            .filter((row) => row.curriculum_id === curriculumId)
            .map((row) => row.semester_number),
        ),
      ].sort((a, b) => a - b),
    [mappings.data, curriculumId],
  );

  return (
    <>
      <PageHeader
        title="Bulk operations"
        description="Import subjects, allocate faculty across many subjects, apply curriculum-wide edits and export academic data."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Bulk operations" }]}
      />

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Subject import</TabsTrigger>
          <TabsTrigger value="allocation">Faculty allocation</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum update</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk subject import</CardTitle>
              <CardDescription>
                Paste CSV with the header <code>{SUBJECT_TEMPLATE}</code>. Subject codes that
                already exist are skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Department for imported subjects</Label>
                  <Select value={importDepartment} onValueChange={setImportDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Programme for imported subjects</Label>
                  <Select value={importProgram} onValueChange={setImportProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {(programs.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject-csv">CSV rows</Label>
                <Textarea
                  id="subject-csv"
                  rows={8}
                  value={csv}
                  placeholder={`${SUBJECT_TEMPLATE}\nCS201,Data Structures,core,4,3,1,2`}
                  onChange={(event) => setCsv(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  className="max-w-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) setCsv(await file.text());
                  }}
                />
                <Button
                  disabled={
                    !canManageCourses || importSubjects.isPending || parsed.rows.length === 0
                  }
                  onClick={() => importSubjects.mutate()}
                >
                  <Upload className="size-4" />
                  Import {parsed.rows.length || ""} subjects
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCsv("subject-import-template", SUBJECT_TEMPLATE.split(","), [
                      ["CS201", "Data Structures", "core", "4", "3", "1", "2"],
                    ])
                  }
                >
                  <Download className="size-4" />
                  Template
                </Button>
                {parsed.rows.length > 0 ? (
                  <Badge variant="outline">{parsed.rows.length} rows parsed</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk faculty allocation</CardTitle>
              <CardDescription>
                Assign one faculty member to many subjects at once for a section, semester and term.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Faculty</Label>
                  <Select value={allocFaculty} onValueChange={setAllocFaculty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {(faculty.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {facultyName(row)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Section</Label>
                  <Select value={allocSection} onValueChange={setAllocSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {(sections.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Semester</Label>
                  <Select value={allocSemester} onValueChange={setAllocSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {(semesters.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Term</Label>
                  <Select value={allocSession} onValueChange={setAllocSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {(academicSessions.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={allocRole} onValueChange={setAllocRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allocationRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {labelize(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alloc-hours">Hours per week</Label>
                  <Input
                    id="alloc-hours"
                    type="number"
                    min={0}
                    max={40}
                    value={allocHours}
                    onChange={(event) => setAllocHours(event.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {(courses.data ?? []).length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    No subjects in the catalogue yet.
                  </p>
                ) : (
                  (courses.data ?? []).map((course) => (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={allocCourses.includes(course.id)}
                        onCheckedChange={() =>
                          setAllocCourses((prev) =>
                            prev.includes(course.id)
                              ? prev.filter((id) => id !== course.id)
                              : [...prev, course.id],
                          )
                        }
                        aria-label={`Select ${course.code}`}
                      />
                      <span className="font-medium">{course.code}</span>
                      <span className="text-muted-foreground">{course.title}</span>
                    </label>
                  ))
                )}
              </div>

              <Button
                disabled={!canAllocate || allocate.isPending || allocCourses.length === 0}
                onClick={() => allocate.mutate()}
              >
                Allocate {allocCourses.length || ""} subjects
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk curriculum update</CardTitle>
              <CardDescription>
                Apply a category or credit value to every mapped subject in a curriculum version or
                a single semester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Curriculum version</Label>
                  <Select value={curriculumId} onValueChange={setCurriculumId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose version" />
                    </SelectTrigger>
                    <SelectContent>
                      {(curricula.data ?? []).map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name} v{row.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Semester</Label>
                  <Select value={updateSemester} onValueChange={setUpdateSemester}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All semesters</SelectItem>
                      {semesterNumbers.map((number) => (
                        <SelectItem key={number} value={String(number)}>
                          Semester {number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={updateCategory} onValueChange={setUpdateCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Leave unchanged" />
                    </SelectTrigger>
                    <SelectContent>
                      {curriculumCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {labelize(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-credits">Credits</Label>
                  <Input
                    id="update-credits"
                    type="number"
                    min={0}
                    max={40}
                    placeholder="Leave blank"
                    value={updateCredits}
                    onChange={(event) => setUpdateCredits(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={
                    !canManageCurriculum || updateCurriculum.isPending || targetRows.length === 0
                  }
                  onClick={() => updateCurriculum.mutate()}
                >
                  Update {targetRows.length || ""} entries
                </Button>
                {curriculumId ? (
                  <Badge variant="outline">{targetRows.length} mapped subjects in scope</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk export</CardTitle>
              <CardDescription>
                Download the academic catalogue and mappings as CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={(courses.data ?? []).length === 0}
                onClick={() =>
                  downloadCsv(
                    "subjects",
                    ["Code", "Title", "Type", "Credits", "L", "T", "P", "Active"],
                    (courses.data ?? []).map((row) => [
                      row.code,
                      row.title,
                      row.type,
                      row.credits ?? "",
                      row.lecture_hours ?? "",
                      row.tutorial_hours ?? "",
                      row.practical_hours ?? "",
                      row.is_active ? "Yes" : "No",
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                Subjects
              </Button>
              <Button
                variant="outline"
                disabled={(mappings.data ?? []).length === 0}
                onClick={() =>
                  downloadCsv(
                    "curriculum-mappings",
                    ["Curriculum", "Semester", "Subject", "Category", "Credits", "Mandatory"],
                    (mappings.data ?? []).map((row) => {
                      const curriculum = curricula.data?.find((c) => c.id === row.curriculum_id);
                      const course = courses.data?.find((c) => c.id === row.course_id);
                      return [
                        curriculum ? `${curriculum.name} v${curriculum.version}` : "",
                        row.semester_number,
                        course ? `${course.code} — ${course.title}` : "",
                        row.category,
                        row.credits ?? "",
                        row.is_mandatory ? "Yes" : "No",
                      ];
                    }),
                  )
                }
              >
                <Download className="size-4" />
                Curriculum mappings
              </Button>
              <Button
                variant="outline"
                disabled={(curricula.data ?? []).length === 0}
                onClick={() =>
                  downloadCsv(
                    "curriculum-versions",
                    [
                      "Curriculum",
                      "Version",
                      "Regulation",
                      "Status",
                      "Effective from",
                      "Planned credits",
                    ],
                    (curricula.data ?? []).map((row) => [
                      row.name,
                      row.version,
                      row.regulation ?? "",
                      row.status,
                      row.effective_from ?? "",
                      row.total_credits ?? "",
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                Curriculum versions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
