import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  labelize,
  optionsFrom,
  specializationKinds,
  useAcademicLookups,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/structure")({
  head: () => ({
    meta: [
      { title: "Academic structure — CampusOS" },
      {
        name: "description",
        content:
          "Configure academic years, terms, semesters, batches, sections, majors, minors and specialisations.",
      },
      { property: "og:title", content: "Academic structure — CampusOS" },
      { property: "og:description", content: "Years, terms, semesters, batches and sections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicStructurePage,
});

interface YearRow extends Record<string, unknown> {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_closed: boolean;
}

interface TermRow extends Record<string, unknown> {
  id: string;
  name: string;
  academic_year_id: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface SemesterRow extends Record<string, unknown> {
  id: string;
  name: string;
  program_id: string | null;
  number: number;
  credits: number | null;
}

interface BatchRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  academic_year_id: string | null;
  entry_year: number | null;
  exit_year: number | null;
  capacity: number | null;
  is_active: boolean;
}

interface SectionRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  semester_id: string | null;
  batch_id: string | null;
  advisor_faculty_id: string | null;
  capacity: number | null;
  is_active: boolean;
}

interface SpecializationRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  kind: string;
  min_credits: number | null;
  description: string | null;
  is_active: boolean;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Inactive"}</Badge>;
}

function AcademicStructurePage() {
  const { programs, semesters, academicYears, batches, faculty } = useAcademicLookups();

  const programOptions = optionsFrom(programs.data);
  const yearOptions = (academicYears.data ?? []).map((row) => ({ value: row.id, label: row.name }));
  const semesterOptions = (semesters.data ?? []).map((row) => ({ value: row.id, label: row.name }));
  const batchOptions = optionsFrom(batches.data);
  const facultyOptions = (faculty.data ?? []).map((row) => ({
    value: row.id,
    label: [row.first_name, row.last_name].filter(Boolean).join(" "),
  }));

  const programName = (id: string | null) => programs.data?.find((p) => p.id === id)?.name ?? null;

  return (
    <>
      <PageHeader
        title="Academic structure"
        description="Years, terms, semesters, cohorts, sections and specialisations that every other module builds on."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Structure" }]}
      />

      <Tabs defaultValue="years" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="years">Academic years</TabsTrigger>
          <TabsTrigger value="terms">Terms & sessions</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="specializations">Majors & minors</TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="space-y-4">
          <ResourcePage<YearRow>
            hideHeader
            title="Academic years"
            description="Academic years"
            table="academic_years"
            select="id, name, start_date, end_date, is_current, is_closed"
            orderBy={{ column: "start_date", ascending: false }}
            managePermission="academic.manage"
            entityLabel="academic year"
            storageKey="academic-years"
            columns={[
              { key: "name", header: "Year", alwaysVisible: true, className: "font-medium" },
              { key: "start_date", header: "Starts" },
              { key: "end_date", header: "Ends" },
              {
                key: "is_current",
                header: "Current",
                value: (row) => (row.is_current ? "Current" : ""),
                render: (row) => (row.is_current ? <Badge>Current</Badge> : null),
              },
              {
                key: "is_closed",
                header: "Closed",
                value: (row) => (row.is_closed ? "Closed" : "Open"),
                render: (row) => (
                  <Badge variant={row.is_closed ? "secondary" : "outline"}>
                    {row.is_closed ? "Closed" : "Open"}
                  </Badge>
                ),
              },
            ]}
            fields={[
              { name: "name", label: "Name", required: true, placeholder: "2026–27" },
              { name: "start_date", label: "Start date", type: "date", required: true },
              { name: "end_date", label: "End date", type: "date", required: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              start_date: row.start_date,
              end_date: row.end_date,
            })}
          />
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <ResourcePage<TermRow>
            hideHeader
            title="Terms and sessions"
            description="Terms"
            table="academic_sessions"
            select="id, name, academic_year_id, term_number, start_date, end_date, is_current"
            orderBy={{ column: "start_date", ascending: false }}
            managePermission="academic.manage"
            entityLabel="term"
            storageKey="academic-sessions"
            columns={[
              { key: "name", header: "Term", alwaysVisible: true, className: "font-medium" },
              {
                key: "academic_year_id",
                header: "Academic year",
                value: (row) =>
                  academicYears.data?.find((y) => y.id === row.academic_year_id)?.name ?? null,
              },
              { key: "term_number", header: "No." },
              { key: "start_date", header: "Starts" },
              { key: "end_date", header: "Ends" },
              {
                key: "is_current",
                header: "Current",
                value: (row) => (row.is_current ? "Current" : ""),
                render: (row) => (row.is_current ? <Badge>Current</Badge> : null),
              },
            ]}
            fields={[
              { name: "name", label: "Term name", required: true, placeholder: "Odd semester" },
              {
                name: "academic_year_id",
                label: "Academic year",
                type: "select",
                required: true,
                options: yearOptions,
              },
              {
                name: "term_number",
                label: "Term number",
                type: "number",
                required: true,
                min: 1,
                max: 6,
              },
              { name: "start_date", label: "Start date", type: "date", required: true },
              { name: "end_date", label: "End date", type: "date", required: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              academic_year_id: row.academic_year_id,
              term_number: row.term_number,
              start_date: row.start_date,
              end_date: row.end_date,
            })}
          />
        </TabsContent>

        <TabsContent value="semesters" className="space-y-4">
          <ResourcePage<SemesterRow>
            hideHeader
            title="Semesters"
            description="Semesters"
            table="semesters"
            select="id, name, program_id, number, credits"
            orderBy={{ column: "number" }}
            managePermission="program.manage"
            entityLabel="semester"
            storageKey="semesters"
            columns={[
              { key: "number", header: "No.", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Semester" },
              {
                key: "program_id",
                header: "Programme",
                value: (row) => programName(row.program_id),
              },
              { key: "credits", header: "Credits" },
            ]}
            fields={[
              { name: "name", label: "Semester name", required: true, placeholder: "Semester 1" },
              { name: "program_id", label: "Programme", type: "select", options: programOptions },
              {
                name: "number",
                label: "Semester number",
                type: "number",
                required: true,
                min: 1,
                max: 20,
              },
              { name: "credits", label: "Credits", type: "number", min: 0, max: 100 },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              program_id: row.program_id ?? "",
              number: row.number,
              credits: row.credits ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <ResourcePage<BatchRow>
            hideHeader
            title="Batches"
            description="Batches"
            table="batches"
            select="id, name, code, program_id, academic_year_id, entry_year, exit_year, capacity, is_active"
            orderBy={{ column: "name" }}
            campusScoped
            managePermission="section.manage"
            entityLabel="batch"
            storageKey="batches"
            columns={[
              { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Batch" },
              {
                key: "program_id",
                header: "Programme",
                value: (row) => programName(row.program_id),
              },
              { key: "entry_year", header: "Entry" },
              { key: "exit_year", header: "Exit" },
              { key: "capacity", header: "Capacity" },
              {
                key: "is_active",
                header: "Status",
                value: (row) => (row.is_active ? "Active" : "Inactive"),
                render: (row) => <ActiveBadge active={row.is_active} />,
              },
            ]}
            fields={[
              { name: "name", label: "Batch name", required: true, placeholder: "B.Tech CSE 2026" },
              { name: "code", label: "Code", required: true },
              { name: "program_id", label: "Programme", type: "select", options: programOptions },
              {
                name: "academic_year_id",
                label: "Academic year",
                type: "select",
                options: yearOptions,
              },
              { name: "entry_year", label: "Entry year", type: "number", min: 1900, max: 2200 },
              { name: "exit_year", label: "Exit year", type: "number", min: 1900, max: 2200 },
              { name: "capacity", label: "Capacity", type: "number", min: 0, max: 5000 },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              code: row.code,
              program_id: row.program_id ?? "",
              academic_year_id: row.academic_year_id ?? "",
              entry_year: row.entry_year ?? "",
              exit_year: row.exit_year ?? "",
              capacity: row.capacity ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <ResourcePage<SectionRow>
            hideHeader
            title="Sections"
            description="Sections"
            table="sections"
            select="id, name, code, program_id, semester_id, batch_id, advisor_faculty_id, capacity, is_active"
            orderBy={{ column: "name" }}
            campusScoped
            managePermission="section.manage"
            entityLabel="section"
            storageKey="sections"
            columns={[
              { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Section" },
              {
                key: "program_id",
                header: "Programme",
                value: (row) => programName(row.program_id),
              },
              {
                key: "semester_id",
                header: "Semester",
                value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? null,
              },
              {
                key: "batch_id",
                header: "Batch",
                value: (row) => batches.data?.find((b) => b.id === row.batch_id)?.name ?? null,
              },
              {
                key: "advisor_faculty_id",
                header: "Class advisor",
                value: (row) => {
                  const member = faculty.data?.find((f) => f.id === row.advisor_faculty_id);
                  return member
                    ? [member.first_name, member.last_name].filter(Boolean).join(" ")
                    : null;
                },
              },
              { key: "capacity", header: "Capacity" },
              {
                key: "is_active",
                header: "Status",
                value: (row) => (row.is_active ? "Active" : "Inactive"),
                render: (row) => <ActiveBadge active={row.is_active} />,
              },
            ]}
            fields={[
              { name: "name", label: "Section name", required: true, placeholder: "Section A" },
              { name: "code", label: "Code", required: true },
              { name: "program_id", label: "Programme", type: "select", options: programOptions },
              { name: "semester_id", label: "Semester", type: "select", options: semesterOptions },
              { name: "batch_id", label: "Batch", type: "select", options: batchOptions },
              {
                name: "advisor_faculty_id",
                label: "Class advisor",
                type: "select",
                options: facultyOptions,
              },
              { name: "capacity", label: "Capacity", type: "number", min: 0, max: 500 },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              code: row.code,
              program_id: row.program_id ?? "",
              semester_id: row.semester_id ?? "",
              batch_id: row.batch_id ?? "",
              advisor_faculty_id: row.advisor_faculty_id ?? "",
              capacity: row.capacity ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="specializations" className="space-y-4">
          <ResourcePage<SpecializationRow>
            hideHeader
            title="Majors, minors and specialisations"
            description="Specialisations"
            table="specializations"
            select="id, name, code, program_id, kind, min_credits, description, is_active"
            orderBy={{ column: "name" }}
            managePermission="program.manage"
            entityLabel="specialisation"
            storageKey="specializations"
            columns={[
              { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Name" },
              {
                key: "kind",
                header: "Type",
                render: (row) => <Badge variant="outline">{labelize(row.kind)}</Badge>,
              },
              {
                key: "program_id",
                header: "Programme",
                value: (row) => programName(row.program_id),
              },
              { key: "min_credits", header: "Min credits" },
              {
                key: "is_active",
                header: "Status",
                value: (row) => (row.is_active ? "Active" : "Inactive"),
                render: (row) => <ActiveBadge active={row.is_active} />,
              },
            ]}
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "code", label: "Code", required: true },
              {
                name: "kind",
                label: "Type",
                type: "select",
                required: true,
                options: specializationKinds.map((value) => ({ value, label: labelize(value) })),
              },
              { name: "program_id", label: "Programme", type: "select", options: programOptions },
              { name: "min_credits", label: "Minimum credits", type: "number", min: 0, max: 300 },
              { name: "description", label: "Description", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              code: row.code,
              kind: row.kind,
              program_id: row.program_id ?? "",
              min_credits: row.min_credits ?? "",
              description: row.description ?? "",
            })}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
