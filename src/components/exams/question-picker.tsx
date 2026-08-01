import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaperQuestionRow, QuestionRow } from "@/hooks/useExams";
import { bloomLevels, difficulties, labelize, percentage } from "@/lib/exams";

const ALL = "__all";

/**
 * Blueprint-aware paper builder: filter the bank by unit, difficulty, Bloom
 * level and outcome, then attach questions to a section of the paper.
 */
export function QuestionPicker({
  questions,
  attached,
  outcomeLabel,
  totalMarks,
  onAdd,
  onRemove,
  readOnly,
}: {
  questions: QuestionRow[];
  attached: (PaperQuestionRow & { question?: QuestionRow })[];
  outcomeLabel: (id: string | null) => string;
  totalMarks: number;
  onAdd: (questions: QuestionRow[], sectionLabel: string) => void;
  onRemove: (ids: string[]) => void;
  readOnly?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState(ALL);
  const [bloom, setBloom] = useState(ALL);
  const [section, setSection] = useState("A");
  const [selected, setSelected] = useState<string[]>([]);

  const attachedIds = new Set(attached.map((row) => row.question_id));

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return questions.filter((row) => {
      if (attachedIds.has(row.id)) return false;
      if (difficulty !== ALL && row.difficulty !== difficulty) return false;
      if (bloom !== ALL && row.bloom !== bloom) return false;
      if (!needle) return true;
      return [row.body, row.topic, row.unit]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, search, difficulty, bloom, attached]);

  const attachedMarks = attached.reduce((sum, row) => sum + Number(row.marks), 0);
  const bloomMix = bloomLevels.map((level) => ({
    level,
    count: attached.filter((row) => row.question?.bloom === level).length,
  }));
  const difficultyMix = difficulties.map((level) => ({
    level,
    count: attached.filter((row) => row.question?.difficulty === level).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Question bank</CardTitle>
          <CardDescription>
            Filter and attach questions to the selected paper section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions…"
              aria-label="Search question bank"
            />
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger aria-label="Difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All difficulty</SelectItem>
                {difficulties.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelize(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bloom} onValueChange={setBloom}>
              <SelectTrigger aria-label="Bloom level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Bloom levels</SelectItem>
                {bloomLevels.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelize(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching questions in the bank.</p>
            ) : (
              filtered.map((question) => (
                <label
                  key={question.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
                >
                  <Checkbox
                    checked={selected.includes(question.id)}
                    disabled={readOnly}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, question.id]
                          : current.filter((id) => id !== question.id),
                      )
                    }
                    aria-label="Select question"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block line-clamp-2">{question.body}</span>
                    <span className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {question.marks} marks
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {labelize(question.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {labelize(question.bloom)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {outcomeLabel(question.course_outcome_id)}
                      </Badge>
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          {!readOnly ? (
            <div className="flex items-center gap-2">
              <Input
                value={section}
                onChange={(event) => setSection(event.target.value.toUpperCase().slice(0, 2))}
                className="w-20"
                aria-label="Section label"
              />
              <Button
                disabled={!selected.length}
                onClick={() => {
                  onAdd(
                    questions.filter((row) => selected.includes(row.id)),
                    section || "A",
                  );
                  setSelected([]);
                }}
              >
                <Plus className="size-4" />
                Add {selected.length || ""} to section {section || "A"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Paper blueprint</CardTitle>
          <CardDescription>
            {attachedMarks} of {totalMarks} marks attached ({percentage(attachedMarks, totalMarks)}
            %)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {difficultyMix.map((row) => (
              <Badge key={row.level} variant="secondary" className="text-[10px]">
                {labelize(row.level)} {row.count}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {bloomMix.map((row) => (
              <Badge key={row.level} variant="outline" className="text-[10px]">
                {labelize(row.level)} {row.count}
              </Badge>
            ))}
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {attached.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No questions attached yet — pick from the bank to build the paper.
              </p>
            ) : (
              attached.map((row) => (
                <div key={row.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Badge variant="secondary" className="shrink-0">
                    {row.section_label}
                  </Badge>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2">{row.question?.body ?? "Question removed"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.marks} marks · {labelize(row.question?.bloom ?? null)} ·{" "}
                      {outcomeLabel(row.question?.course_outcome_id ?? null)}
                    </p>
                  </div>
                  {!readOnly ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Remove question"
                      onClick={() => onRemove([row.id])}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
