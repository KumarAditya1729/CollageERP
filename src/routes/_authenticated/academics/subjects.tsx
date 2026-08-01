import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SubjectSheet, type SubjectRow } from "@/components/academics/subject-sheet";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { labelize, optionsFrom, useAcademicLookups } from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/subjects")({
  head: () => ({
    meta: [
      { title: "Subject management — CampusOS" },
      {
        name: "description",
        content:
          "Subjects with codes, credits, L-T-P structure, prerequisites, course outcomes and CO–PO mapping.",
      },
      { property: "og:title", content: "Subject management — CampusOS" },
      { property: "og:description", content: "Subjects, outcomes and CO–PO mapping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubjectsPage,
});

const courseTypes = ["core", "elective", "open_elective", "lab", "project", "internship", "audit"];

function SubjectsPage() {
  const { departments, programs, semesters } = useAcademicLookups();
  const [selected, setSelected] = useState<SubjectRow | null>(null);

  return (
    <>
      <ResourcePage<SubjectRow>
        title="Subjects"
        description="Every taught subject with its credit and contact-hour structure. Open a subject for outcomes, prerequisites and CO–PO mapping."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Subjects" }]}
        table="courses"
        select="id, tenant_id, code, title, type, credits, lecture_hours, tutorial_hours, practical_hours, department_id, program_id, semester_id, is_active, description"
        orderBy={{ column: "code" }}
        managePermission="course.manage"
        entityLabel="subject"
        storageKey="subjects"
        onRowClick={(row) => setSelected(row)}
        columns={[
          { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
          { key: "title", header: "Subject" },
          {
            key: "type",
            header: "Type",
            render: (row) => <Badge variant="outline">{labelize(row.type)}</Badge>,
          },
          {
            key: "department_id",
            header: "Department",
            value: (row) => departments.data?.find((d) => d.id === row.department_id)?.name ?? null,
          },
          {
            key: "program_id",
            header: "Programme",
            value: (row) => programs.data?.find((p) => p.id === row.program_id)?.name ?? null,
            defaultHidden: true,
          },
          {
            key: "semester_id",
            header: "Semester",
            value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? null,
          },
          { key: "credits", header: "Credits" },
          {
            key: "ltp",
            header: "L-T-P",
            value: (row) =>
              `${row.lecture_hours ?? 0}-${row.tutorial_hours ?? 0}-${row.practical_hours ?? 0}`,
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
          { name: "code", label: "Subject code", required: true },
          { name: "title", label: "Title", required: true },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: courseTypes.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: optionsFrom(departments.data),
          },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            options: optionsFrom(programs.data),
          },
          {
            name: "semester_id",
            label: "Semester",
            type: "select",
            options: (semesters.data ?? []).map((row) => ({ value: row.id, label: row.name })),
          },
          { name: "credits", label: "Credits", type: "number", min: 0, max: 40 },
          { name: "lecture_hours", label: "Lecture hours", type: "number", min: 0, max: 40 },
          { name: "tutorial_hours", label: "Tutorial hours", type: "number", min: 0, max: 40 },
          { name: "practical_hours", label: "Practical hours", type: "number", min: 0, max: 40 },
          { name: "description", label: "Description", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          code: row.code,
          title: row.title,
          type: row.type,
          department_id: row.department_id ?? "",
          program_id: row.program_id ?? "",
          semester_id: row.semester_id ?? "",
          credits: row.credits ?? "",
          lecture_hours: row.lecture_hours ?? "",
          tutorial_hours: row.tutorial_hours ?? "",
          practical_hours: row.practical_hours ?? "",
          description: row.description ?? "",
        })}
      />

      <SubjectSheet subject={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
