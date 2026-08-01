import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionsFrom, useAcademicLookups } from "@/hooks/useAcademics";
import {
  useGradingScales,
  useRubrics,
  type AssessmentTypeRow,
  type GradeBandRow,
  type GradingScaleRow,
  type RubricCriterionRow,
  type RubricRow,
} from "@/hooks/useExams";
import { assessmentCategories, labelize, optionsOf } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/framework")({
  head: () => ({
    meta: [
      { title: "Assessment framework — CampusOS" },
      {
        name: "description",
        content:
          "Configure assessment types, weightage and passing rules, grading scales, grade bands and evaluation rubrics.",
      },
      { property: "og:title", content: "Assessment framework — CampusOS" },
      { property: "og:description", content: "Assessment types, grading policies and rubrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FrameworkPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Framework unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function FrameworkPage() {
  const { programs, courses } = useAcademicLookups();
  const scales = useGradingScales();
  const rubrics = useRubrics();
  const [scaleId, setScaleId] = useState<string>("");
  const [rubricId, setRubricId] = useState<string>("");

  const activeScale = useMemo(
    () => (scales.data ?? []).find((row) => row.id === scaleId) ?? (scales.data ?? [])[0] ?? null,
    [scales.data, scaleId],
  );
  const activeRubric = useMemo(
    () =>
      (rubrics.data ?? []).find((row) => row.id === rubricId) ?? (rubrics.data ?? [])[0] ?? null,
    [rubrics.data, rubricId],
  );

  return (
    <>
      <PageHeader
        title="Assessment framework"
        description="Assessment types, weightage and passing rules, grading policies, grade bands and rubrics used across every module."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Framework" }]}
      />

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Assessment types</TabsTrigger>
          <TabsTrigger value="scales">Grading scales</TabsTrigger>
          <TabsTrigger value="bands">Grade bands</TabsTrigger>
          <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <ResourcePage<AssessmentTypeRow>
            hideHeader
            title="Assessment types"
            description=""
            table="assessment_types"
            select="id, key, name, category, description, default_max_marks, default_weightage, passing_percentage, is_internal, is_credit_linked, requires_approval, allows_grace, is_active, sort_order"
            orderBy={{ column: "sort_order" }}
            managePermission="exam.manage"
            entityLabel="assessment type"
            storageKey="exam-assessment-types"
            columns={[
              { key: "name", header: "Name", value: (row) => row.name, sortable: true },
              { key: "key", header: "Key", value: (row) => row.key },
              {
                key: "category",
                header: "Category",
                value: (row) => row.category,
                render: (row) => <Badge variant="secondary">{labelize(row.category)}</Badge>,
              },
              { key: "max", header: "Max marks", value: (row) => row.default_max_marks },
              { key: "weightage", header: "Weightage %", value: (row) => row.default_weightage },
              { key: "pass", header: "Pass %", value: (row) => row.passing_percentage },
              {
                key: "internal",
                header: "Internal",
                value: (row) => (row.is_internal ? "Yes" : "No"),
              },
              {
                key: "credit",
                header: "Credit linked",
                value: (row) => (row.is_credit_linked ? "Yes" : "No"),
              },
            ]}
            fields={[
              { name: "name", label: "Name", required: true },
              {
                name: "key",
                label: "Key",
                required: true,
                help: "Stable identifier, e.g. mid_sem",
              },
              {
                name: "category",
                label: "Category",
                type: "select",
                required: true,
                options: optionsOf(assessmentCategories),
              },
              {
                name: "default_max_marks",
                label: "Default max marks",
                type: "number",
                required: true,
              },
              { name: "default_weightage", label: "Weightage %", type: "number", required: true },
              { name: "passing_percentage", label: "Passing %", type: "number", required: true },
              {
                name: "is_internal",
                label: "Internal assessment",
                type: "select",
                options: [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ],
              },
              {
                name: "is_credit_linked",
                label: "Credit linked",
                type: "select",
                options: [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ],
              },
              {
                name: "allows_grace",
                label: "Allows grace marks",
                type: "select",
                options: [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ],
              },
              {
                name: "requires_approval",
                label: "Requires approval",
                type: "select",
                options: [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ],
              },
              { name: "sort_order", label: "Sort order", type: "number" },
              { name: "description", label: "Description", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              key: row.key,
              category: row.category,
              default_max_marks: row.default_max_marks,
              default_weightage: row.default_weightage,
              passing_percentage: row.passing_percentage,
              is_internal: String(row.is_internal),
              is_credit_linked: String(row.is_credit_linked),
              allows_grace: String(row.allows_grace),
              requires_approval: String(row.requires_approval),
              sort_order: row.sort_order,
              description: row.description ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="scales" className="space-y-4">
          <ResourcePage<GradingScaleRow>
            hideHeader
            title="Grading scales"
            description=""
            table="grading_scales"
            select="id, name, code, program_id, description, max_grade_point, passing_grade_point, is_default, is_active"
            orderBy={{ column: "name" }}
            managePermission="exam.manage"
            entityLabel="grading scale"
            storageKey="exam-grading-scales"
            columns={[
              { key: "name", header: "Name", value: (row) => row.name, sortable: true },
              { key: "code", header: "Code", value: (row) => row.code },
              {
                key: "program",
                header: "Programme",
                value: (row) =>
                  (programs.data ?? []).find((item) => item.id === row.program_id)?.name ?? "All",
              },
              { key: "max", header: "Max point", value: (row) => row.max_grade_point },
              { key: "pass", header: "Pass point", value: (row) => row.passing_grade_point },
              {
                key: "default",
                header: "Default",
                render: (row) => (row.is_default ? <Badge>Default</Badge> : null),
                value: (row) => (row.is_default ? "Yes" : "No"),
              },
            ]}
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "code", label: "Code", required: true },
              {
                name: "program_id",
                label: "Programme",
                type: "select",
                options: optionsFrom(programs.data),
              },
              { name: "max_grade_point", label: "Max grade point", type: "number", required: true },
              {
                name: "passing_grade_point",
                label: "Passing grade point",
                type: "number",
                required: true,
              },
              {
                name: "is_default",
                label: "Institution default",
                type: "select",
                options: [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ],
              },
              { name: "description", label: "Description", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              code: row.code,
              program_id: row.program_id ?? "",
              max_grade_point: row.max_grade_point,
              passing_grade_point: row.passing_grade_point,
              is_default: String(row.is_default),
              description: row.description ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="bands" className="space-y-4">
          <div className="max-w-sm">
            <Select value={activeScale?.id ?? ""} onValueChange={setScaleId}>
              <SelectTrigger aria-label="Grading scale">
                <SelectValue placeholder="Select a grading scale" />
              </SelectTrigger>
              <SelectContent>
                {(scales.data ?? []).map((scale) => (
                  <SelectItem key={scale.id} value={scale.id}>
                    {scale.code} — {scale.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeScale ? (
            <ResourcePage<GradeBandRow>
              key={activeScale.id}
              hideHeader
              title="Grade bands"
              description=""
              table="grade_bands"
              select="id, grading_scale_id, grade, min_percentage, max_percentage, grade_point, is_pass, remark, sort_order"
              orderBy={{ column: "min_percentage", ascending: false }}
              managePermission="exam.manage"
              entityLabel="grade band"
              storageKey="exam-grade-bands"
              defaults={{ grading_scale_id: activeScale.id }}
              columns={[
                { key: "grade", header: "Grade", value: (row) => row.grade, sortable: true },
                { key: "min", header: "From %", value: (row) => row.min_percentage },
                { key: "max", header: "To %", value: (row) => row.max_percentage },
                { key: "point", header: "Grade point", value: (row) => row.grade_point },
                { key: "pass", header: "Pass", value: (row) => (row.is_pass ? "Yes" : "No") },
                { key: "remark", header: "Remark", value: (row) => row.remark ?? "—" },
              ]}
              fields={[
                { name: "grade", label: "Grade", required: true },
                { name: "min_percentage", label: "From %", type: "number", required: true },
                { name: "max_percentage", label: "To %", type: "number", required: true },
                { name: "grade_point", label: "Grade point", type: "number", required: true },
                {
                  name: "is_pass",
                  label: "Counts as pass",
                  type: "select",
                  options: [
                    { value: "true", label: "Yes" },
                    { value: "false", label: "No" },
                  ],
                },
                { name: "remark", label: "Remark" },
              ]}
              toFormValues={(row) => ({
                grade: row.grade,
                min_percentage: row.min_percentage,
                max_percentage: row.max_percentage,
                grade_point: row.grade_point,
                is_pass: String(row.is_pass),
                remark: row.remark ?? "",
              })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a grading scale first — bands hang off a scale.
            </p>
          )}
        </TabsContent>

        <TabsContent value="rubrics" className="space-y-4">
          <ResourcePage<RubricRow>
            hideHeader
            title="Rubrics"
            description=""
            table="rubrics"
            select="id, course_id, name, description, total_points, is_active"
            orderBy={{ column: "name" }}
            managePermission="exam.manage"
            entityLabel="rubric"
            storageKey="exam-rubrics"
            onRowClick={(row) => setRubricId(row.id)}
            columns={[
              { key: "name", header: "Name", value: (row) => row.name, sortable: true },
              {
                key: "course",
                header: "Subject",
                value: (row) =>
                  (courses.data ?? []).find((item) => item.id === row.course_id)?.code ?? "All",
              },
              { key: "points", header: "Total points", value: (row) => row.total_points },
              { key: "active", header: "Active", value: (row) => (row.is_active ? "Yes" : "No") },
            ]}
            fields={[
              { name: "name", label: "Name", required: true },
              {
                name: "course_id",
                label: "Subject",
                type: "select",
                options: optionsFrom(courses.data),
              },
              { name: "total_points", label: "Total points", type: "number", required: true },
              { name: "description", label: "Description", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              course_id: row.course_id ?? "",
              total_points: row.total_points,
              description: row.description ?? "",
            })}
          />

          {activeRubric ? (
            <ResourcePage<RubricCriterionRow>
              key={activeRubric.id}
              hideHeader
              title={`Criteria — ${activeRubric.name}`}
              description=""
              table="rubric_criteria"
              select="id, rubric_id, course_outcome_id, title, description, max_points, sort_order"
              orderBy={{ column: "sort_order" }}
              managePermission="exam.manage"
              entityLabel="criterion"
              storageKey="exam-rubric-criteria"
              defaults={{ rubric_id: activeRubric.id }}
              columns={[
                { key: "title", header: "Criterion", value: (row) => row.title },
                { key: "points", header: "Max points", value: (row) => row.max_points },
                { key: "order", header: "Order", value: (row) => row.sort_order },
              ]}
              fields={[
                { name: "title", label: "Criterion", required: true },
                { name: "max_points", label: "Max points", type: "number", required: true },
                { name: "sort_order", label: "Order", type: "number" },
                { name: "description", label: "Description", type: "textarea", full: true },
              ]}
              toFormValues={(row) => ({
                title: row.title,
                max_points: row.max_points,
                sort_order: row.sort_order,
                description: row.description ?? "",
              })}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </>
  );
}
