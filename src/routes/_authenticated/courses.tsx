import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { useResourceList } from "@/hooks/useResource";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Courses — CampusOS" },
      {
        name: "description",
        content: "Course catalogue with credits, contact hours, type and owning programme.",
      },
      { property: "og:title", content: "Courses — CampusOS" },
      { property: "og:description", content: "The course catalogue for your college." },
    ],
  }),
  component: CoursesPage,
});

interface CourseRow extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  is_active: boolean;
  program_id: string | null;
  department_id: string | null;
  description: string | null;
}

const courseTypes = ["core", "elective", "open_elective", "lab", "project", "internship", "audit"];

function CoursesPage() {
  const programs = useResourceList<{ id: string; name: string }>({
    table: "programs",
    select: "id, name",
    orderBy: { column: "name" },
  });
  const departments = useResourceList<{ id: string; name: string }>({
    table: "departments",
    select: "id, name",
    orderBy: { column: "name" },
  });

  return (
    <ResourcePage<CourseRow>
      title="Courses"
      description="The course catalogue, including credits, contact hours and the programme each course belongs to."
      crumbs={[{ label: "Academics" }, { label: "Courses" }]}
      table="courses"
      select="id, code, title, type, credits, lecture_hours, tutorial_hours, practical_hours, is_active, program_id, department_id, description"
      orderBy={{ column: "code" }}
      managePermission="course.manage"
      entityLabel="course"
      storageKey="courses"
      columns={[
        { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
        { key: "title", header: "Course" },
        {
          key: "type",
          header: "Type",
          render: (row) => (
            <Badge variant="outline" className="capitalize">
              {row.type?.replace(/_/g, " ") ?? "-"}
            </Badge>
          ),
        },
        {
          key: "program_id",
          header: "Programme",
          value: (row) => programs.data?.find((p) => p.id === row.program_id)?.name ?? null,
        },
        {
          key: "department_id",
          header: "Department",
          defaultHidden: true,
          value: (row) => departments.data?.find((d) => d.id === row.department_id)?.name ?? null,
        },
        { key: "credits", header: "Credits" },
        {
          key: "hours",
          header: "L-T-P",
          sortable: false,
          value: (row) => `${row.lecture_hours}-${row.tutorial_hours}-${row.practical_hours}`,
        },
        {
          key: "is_active",
          header: "Status",
          value: (row) => (row.is_active ? "Active" : "Inactive"),
          render: (row) => (
            <Badge variant={row.is_active ? "default" : "secondary"}>
              {row.is_active ? "Active" : "Inactive"}
            </Badge>
          ),
        },
      ]}
      fields={[
        { name: "code", label: "Course code", required: true },
        { name: "title", label: "Course title", required: true },
        {
          name: "type",
          label: "Course type",
          type: "select",
          required: true,
          options: courseTypes.map((value) => ({ value, label: value.replace(/_/g, " ") })),
        },
        { name: "credits", label: "Credits", type: "number", required: true, min: 0, max: 30 },
        { name: "lecture_hours", label: "Lecture hours", type: "number", min: 0, max: 30 },
        { name: "tutorial_hours", label: "Tutorial hours", type: "number", min: 0, max: 30 },
        { name: "practical_hours", label: "Practical hours", type: "number", min: 0, max: 30 },
        {
          name: "program_id",
          label: "Programme",
          type: "select",
          options: (programs.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "department_id",
          label: "Department",
          type: "select",
          options: (departments.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        code: row.code,
        title: row.title,
        type: row.type,
        credits: row.credits,
        lecture_hours: row.lecture_hours,
        tutorial_hours: row.tutorial_hours,
        practical_hours: row.practical_hours,
        program_id: row.program_id ?? "",
        department_id: row.department_id ?? "",
        description: row.description ?? "",
      })}
    />
  );
}
