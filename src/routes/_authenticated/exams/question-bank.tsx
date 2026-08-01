import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { ResourcePage } from "@/components/common/resource-page";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { useAcademicLookups } from "@/hooks/useAcademics";
import { useCourseOutcomes, type QuestionRow } from "@/hooks/useExams";
import { bloomLevels, difficulties, labelize, optionsOf, questionTypes } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/question-bank")({
  head: () => ({
    meta: [
      { title: "Question bank — CampusOS" },
      {
        name: "description",
        content:
          "Curated question bank with unit, topic, difficulty, Bloom taxonomy and course-outcome mapping for every subject.",
      },
      { property: "og:title", content: "Question bank — CampusOS" },
      { property: "og:description", content: "Outcome-mapped question bank with Bloom taxonomy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuestionBankPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Question bank unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

function QuestionBankPage() {
  const { courses } = useAcademicLookups();
  const outcomes = useCourseOutcomes();

  const outcomeOptions = useMemo(
    () =>
      (outcomes.data ?? []).map((row) => ({
        value: row.id,
        label: `${row.code} — ${row.description.slice(0, 48)}`,
      })),
    [outcomes.data],
  );

  return (
    <ResourcePage<QuestionRow>
      title="Question bank"
      description="Every question is tagged with a subject, unit, difficulty, Bloom level and course outcome so papers stay blueprint-compliant."
      crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Question bank" }]}
      table="questions"
      select="id, course_id, course_outcome_id, program_outcome_id, unit, topic, body, answer_key, marks, difficulty, bloom, question_type, usage_count, is_active"
      orderBy={{ column: "created_at", ascending: false }}
      managePermission="questionpaper.manage"
      entityLabel="question"
      storageKey="exam-questions"
      columns={[
        {
          key: "body",
          header: "Question",
          value: (row) => row.body,
          render: (row) => <span className="line-clamp-2 max-w-md">{row.body}</span>,
        },
        {
          key: "course",
          header: "Subject",
          value: (row) =>
            (courses.data ?? []).find((item) => item.id === row.course_id)?.code ?? "—",
        },
        { key: "unit", header: "Unit", value: (row) => row.unit ?? "—" },
        { key: "marks", header: "Marks", value: (row) => row.marks, sortable: true },
        {
          key: "difficulty",
          header: "Difficulty",
          value: (row) => row.difficulty,
          render: (row) => <Badge variant="outline">{labelize(row.difficulty)}</Badge>,
        },
        {
          key: "bloom",
          header: "Bloom",
          value: (row) => row.bloom,
          render: (row) => <Badge variant="secondary">{labelize(row.bloom)}</Badge>,
        },
        {
          key: "outcome",
          header: "CO",
          value: (row) =>
            (outcomes.data ?? []).find((item) => item.id === row.course_outcome_id)?.code ?? "—",
        },
        { key: "usage", header: "Used", value: (row) => row.usage_count },
      ]}
      fields={[
        { name: "body", label: "Question", type: "textarea", required: true, full: true },
        {
          name: "course_id",
          label: "Subject",
          type: "select",
          options: (courses.data ?? []).map((row) => ({
            value: row.id,
            label: `${row.code} — ${row.title}`,
          })),
        },
        {
          name: "course_outcome_id",
          label: "Course outcome",
          type: "select",
          options: outcomeOptions,
        },
        { name: "unit", label: "Unit" },
        { name: "topic", label: "Topic" },
        { name: "marks", label: "Marks", type: "number", required: true },
        {
          name: "difficulty",
          label: "Difficulty",
          type: "select",
          required: true,
          options: optionsOf(difficulties),
        },
        {
          name: "bloom",
          label: "Bloom level",
          type: "select",
          required: true,
          options: optionsOf(bloomLevels),
        },
        {
          name: "question_type",
          label: "Question type",
          type: "select",
          options: optionsOf(questionTypes),
        },
        { name: "answer_key", label: "Answer key / scheme", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        body: row.body,
        course_id: row.course_id ?? "",
        course_outcome_id: row.course_outcome_id ?? "",
        unit: row.unit ?? "",
        topic: row.topic ?? "",
        marks: row.marks,
        difficulty: row.difficulty,
        bloom: row.bloom,
        question_type: row.question_type,
        answer_key: row.answer_key ?? "",
      })}
    />
  );
}
