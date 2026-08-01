import { Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { percentage } from "@/lib/exams";
import type { MarkInput } from "@/hooks/useExams";

export interface MarksCandidate {
  studentId: string;
  name: string;
  rollNumber: string | null;
  attendance?: number | null;
  eligible?: boolean;
}

export interface ExistingMark {
  studentId: string;
  marksObtained: number | null;
  graceMarks: number;
  moderationDelta: number;
  isAbsent: boolean;
  isMalpractice: boolean;
  remarks: string | null;
}

/**
 * Spreadsheet-style marks entry supporting grace marks, moderation deltas,
 * absentee/malpractice flags and CSV-style bulk paste into the marks column.
 */
export function MarksEntryGrid({
  candidates,
  existing,
  maxMarks,
  passingMarks,
  readOnly,
  saving,
  onSave,
  allowGrace = true,
  allowModeration = true,
}: {
  candidates: MarksCandidate[];
  existing: ExistingMark[];
  maxMarks: number;
  passingMarks?: number;
  readOnly?: boolean;
  saving?: boolean;
  onSave: (entries: MarkInput[]) => void;
  allowGrace?: boolean;
  allowModeration?: boolean;
}) {
  const [rows, setRows] = useState<Record<string, MarkInput>>({});
  const [bulk, setBulk] = useState("");

  useEffect(() => {
    const next: Record<string, MarkInput> = {};
    for (const candidate of candidates) {
      const found = existing.find((row) => row.studentId === candidate.studentId);
      next[candidate.studentId] = {
        studentId: candidate.studentId,
        marksObtained: found?.marksObtained ?? null,
        graceMarks: found?.graceMarks ?? 0,
        moderationDelta: found?.moderationDelta ?? 0,
        isAbsent: found?.isAbsent ?? false,
        isMalpractice: found?.isMalpractice ?? false,
        remarks: found?.remarks ?? null,
      };
    }
    setRows(next);
  }, [candidates, existing]);

  const patch = (studentId: string, values: Partial<MarkInput>) =>
    setRows((current) => ({
      ...current,
      [studentId]: { ...current[studentId]!, ...values },
    }));

  const summary = useMemo(() => {
    const entered = Object.values(rows).filter((row) => row.marksObtained !== null || row.isAbsent);
    const passed = entered.filter(
      (row) =>
        !row.isAbsent &&
        (row.marksObtained ?? 0) + (row.graceMarks ?? 0) + (row.moderationDelta ?? 0) >=
          (passingMarks ?? maxMarks * 0.4),
    );
    return { entered: entered.length, passed: passed.length, total: candidates.length };
  }, [rows, candidates.length, passingMarks, maxMarks]);

  const applyBulk = () => {
    const lines = bulk
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    let applied = 0;
    setRows((current) => {
      const next = { ...current };
      for (const line of lines) {
        const [key, value] = line.split(/[,\t;]/).map((part) => part.trim());
        if (!key) continue;
        const candidate = candidates.find(
          (row) =>
            row.rollNumber?.toLowerCase() === key.toLowerCase() ||
            row.studentId === key ||
            row.name.toLowerCase() === key.toLowerCase(),
        );
        if (!candidate) continue;
        const parsed = value === undefined || value === "" ? null : Number(value);
        const absent = value?.toUpperCase() === "AB";
        next[candidate.studentId] = {
          ...next[candidate.studentId]!,
          marksObtained: absent || parsed === null || Number.isNaN(parsed) ? null : parsed,
          isAbsent: absent,
        };
        applied += 1;
      }
      return next;
    });
    if (applied) setBulk("");
  };

  if (!candidates.length) {
    return (
      <EmptyState
        title="No candidates"
        description="Register students for this exam or assessment before entering marks."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">Max {maxMarks}</Badge>
        {passingMarks !== undefined ? <Badge variant="outline">Pass {passingMarks}</Badge> : null}
        <span>
          {summary.entered}/{summary.total} entered · {summary.passed} passing
        </span>
      </div>

      {!readOnly ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium" htmlFor="bulk-marks">
              Bulk paste — one <code>roll number, marks</code> per line (use AB for absent)
            </label>
            <Input
              id="bulk-marks"
              value={bulk}
              onChange={(event) => setBulk(event.target.value)}
              placeholder="21CS001, 68"
            />
          </div>
          <Button type="button" variant="outline" onClick={applyBulk} disabled={!bulk.trim()}>
            <Sparkles className="size-4" />
            Apply
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="w-28 text-right">Marks</TableHead>
              {allowGrace ? <TableHead className="w-24 text-right">Grace</TableHead> : null}
              {allowModeration ? (
                <TableHead className="w-28 text-right">Moderation</TableHead>
              ) : null}
              <TableHead className="w-24 text-right">Final</TableHead>
              <TableHead className="w-20 text-center">Absent</TableHead>
              <TableHead className="w-28 text-center">Malpractice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => {
              const row = rows[candidate.studentId];
              if (!row) return null;
              const final =
                (row.marksObtained ?? 0) + (row.graceMarks ?? 0) + (row.moderationDelta ?? 0);
              return (
                <TableRow key={candidate.studentId}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {candidate.rollNumber ?? "No roll number"}
                        {candidate.attendance !== undefined && candidate.attendance !== null
                          ? ` · attendance ${candidate.attendance}%`
                          : ""}
                        {candidate.eligible === false ? " · not eligible" : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="h-8 text-right"
                      min={0}
                      max={maxMarks}
                      disabled={readOnly || row.isAbsent}
                      value={row.marksObtained ?? ""}
                      onChange={(event) =>
                        patch(candidate.studentId, {
                          marksObtained:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      aria-label={`Marks for ${candidate.name}`}
                    />
                  </TableCell>
                  {allowGrace ? (
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="h-8 text-right"
                        disabled={readOnly}
                        value={row.graceMarks ?? 0}
                        onChange={(event) =>
                          patch(candidate.studentId, {
                            graceMarks: Number(event.target.value || 0),
                          })
                        }
                        aria-label={`Grace marks for ${candidate.name}`}
                      />
                    </TableCell>
                  ) : null}
                  {allowModeration ? (
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="h-8 text-right"
                        disabled={readOnly}
                        value={row.moderationDelta ?? 0}
                        onChange={(event) =>
                          patch(candidate.studentId, {
                            moderationDelta: Number(event.target.value || 0),
                          })
                        }
                        aria-label={`Moderation for ${candidate.name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right tabular-nums">
                    {row.isAbsent ? (
                      <Badge variant="destructive">AB</Badge>
                    ) : (
                      <span>
                        {final}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({percentage(final, maxMarks)}%)
                        </span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.isAbsent}
                      disabled={readOnly}
                      onCheckedChange={(checked) =>
                        patch(candidate.studentId, {
                          isAbsent: Boolean(checked),
                          marksObtained: checked ? null : row.marksObtained,
                        })
                      }
                      aria-label={`Mark ${candidate.name} absent`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.isMalpractice}
                      disabled={readOnly}
                      onCheckedChange={(checked) =>
                        patch(candidate.studentId, { isMalpractice: Boolean(checked) })
                      }
                      aria-label={`Flag ${candidate.name} for malpractice`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button onClick={() => onSave(Object.values(rows))} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving…" : "Save marks"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
