import type { Database } from "@/integrations/supabase/types";

export type AssessmentCategory = Database["public"]["Enums"]["assessment_category"];
export type ExamStatus = Database["public"]["Enums"]["exam_status"];
export type ExamRegistrationStatus = Database["public"]["Enums"]["exam_registration_status"];
export type QuestionDifficulty = Database["public"]["Enums"]["question_difficulty"];
export type BloomLevel = Database["public"]["Enums"]["bloom_level"];
export type QuestionPaperStatus = Database["public"]["Enums"]["question_paper_status"];
export type MarkStatus = Database["public"]["Enums"]["mark_status"];
export type EvaluationKind = Database["public"]["Enums"]["evaluation_kind"];
export type RevaluationKind = Database["public"]["Enums"]["revaluation_kind"];
export type ResultStatus = Database["public"]["Enums"]["result_status"];
export type ExamDutyRole = Database["public"]["Enums"]["exam_duty_role"];
export type CertificateKind = Database["public"]["Enums"]["certificate_kind"];

export const assessmentCategories: AssessmentCategory[] = [
  "internal",
  "mid_semester",
  "end_semester",
  "quiz",
  "assignment",
  "project",
  "practical",
  "lab",
  "seminar",
  "presentation",
  "viva",
  "continuous",
  "custom",
];

export const examStatuses: ExamStatus[] = [
  "planned",
  "scheduled",
  "registration_open",
  "in_progress",
  "evaluation",
  "completed",
  "published",
  "cancelled",
];

export const registrationStatuses: ExamRegistrationStatus[] = [
  "pending",
  "eligible",
  "ineligible",
  "registered",
  "withheld",
  "cancelled",
];

export const difficulties: QuestionDifficulty[] = ["easy", "moderate", "difficult"];

export const bloomLevels: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

export const paperStatuses: QuestionPaperStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "locked",
  "released",
];

export const markStatuses: MarkStatus[] = [
  "draft",
  "submitted",
  "under_moderation",
  "approved",
  "published",
  "rejected",
];

export const evaluationKinds: EvaluationKind[] = [
  "first",
  "second",
  "third",
  "moderation",
  "revaluation",
  "challenge",
];

export const revaluationKinds: RevaluationKind[] = [
  "revaluation",
  "challenge",
  "retotal",
  "photocopy",
];

export const resultStatuses: ResultStatus[] = [
  "draft",
  "provisional",
  "pending_approval",
  "approved",
  "published",
  "withheld",
];

export const dutyRoles: ExamDutyRole[] = [
  "invigilator",
  "observer",
  "squad",
  "coordinator",
  "relief",
];

export const certificateKinds: CertificateKind[] = [
  "marksheet",
  "grade_card",
  "transcript",
  "provisional",
  "migration",
  "bonafide",
];

export const markComponents = [
  "internal",
  "external",
  "lab",
  "practical",
  "project",
  "viva",
] as const;
export type MarkComponent = (typeof markComponents)[number];

export const questionTypes = [
  "descriptive",
  "objective",
  "mcq",
  "numerical",
  "case_study",
  "practical",
] as const;

export function labelize(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function optionsOf<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: labelize(value) }));
}

/* ------------------------------------------------------------------ *
 * Grading engine
 * ------------------------------------------------------------------ */

export interface GradeBand {
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_point: number;
  is_pass: boolean;
}

/** Fallback 10-point CBCS scale used when a tenant has not configured one. */
export const defaultGradeBands: GradeBand[] = [
  { grade: "O", min_percentage: 90, max_percentage: 100, grade_point: 10, is_pass: true },
  { grade: "A+", min_percentage: 80, max_percentage: 89.99, grade_point: 9, is_pass: true },
  { grade: "A", min_percentage: 70, max_percentage: 79.99, grade_point: 8, is_pass: true },
  { grade: "B+", min_percentage: 60, max_percentage: 69.99, grade_point: 7, is_pass: true },
  { grade: "B", min_percentage: 55, max_percentage: 59.99, grade_point: 6, is_pass: true },
  { grade: "C", min_percentage: 50, max_percentage: 54.99, grade_point: 5, is_pass: true },
  { grade: "P", min_percentage: 40, max_percentage: 49.99, grade_point: 4, is_pass: true },
  { grade: "F", min_percentage: 0, max_percentage: 39.99, grade_point: 0, is_pass: false },
];

export function gradeFor(percentage: number, bands: GradeBand[] = defaultGradeBands): GradeBand {
  const sorted = [...bands].sort((a, b) => b.min_percentage - a.min_percentage);
  const match = sorted.find((band) => percentage >= band.min_percentage);
  return match ?? sorted[sorted.length - 1] ?? defaultGradeBands[defaultGradeBands.length - 1]!;
}

export interface CourseResultInput {
  credits: number;
  gradePoint: number;
  isPass: boolean;
}

export function computeSgpa(rows: CourseResultInput[]): number {
  const credits = rows.reduce((sum, row) => sum + row.credits, 0);
  if (credits <= 0) return 0;
  const points = rows.reduce((sum, row) => sum + row.credits * row.gradePoint, 0);
  return round2(points / credits);
}

export function computeCgpa(semesters: { credits: number; sgpa: number }[]): number {
  const credits = semesters.reduce((sum, row) => sum + row.credits, 0);
  if (credits <= 0) return 0;
  return round2(semesters.reduce((sum, row) => sum + row.credits * row.sgpa, 0) / credits);
}

export function creditsEarned(rows: CourseResultInput[]): number {
  return round2(rows.filter((row) => row.isPass).reduce((sum, row) => sum + row.credits, 0));
}

export function classAward(percentage: number): string {
  if (percentage >= 75) return "First class with distinction";
  if (percentage >= 60) return "First class";
  if (percentage >= 50) return "Second class";
  if (percentage >= 40) return "Pass class";
  return "Fail";
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentage(obtained: number, max: number) {
  if (!max) return 0;
  return round2((obtained / max) * 100);
}

/** Dense ranking on total percentage, highest first. */
export function rankRows<T>(rows: T[], score: (row: T) => number): Map<T, number> {
  const sorted = [...rows].sort((a, b) => score(b) - score(a));
  const ranks = new Map<T, number>();
  let lastScore: number | null = null;
  let lastRank = 0;
  sorted.forEach((row, index) => {
    const value = score(row);
    if (lastScore === null || value < lastScore) {
      lastRank = index + 1;
      lastScore = value;
    }
    ranks.set(row, lastRank);
  });
  return ranks;
}

/* ------------------------------------------------------------------ *
 * Outcome attainment
 * ------------------------------------------------------------------ */

export interface AttainmentInput {
  outcomeId: string;
  obtained: number;
  max: number;
}

/** NBA-style attainment levels (0–3) from the percentage of the target met. */
export function attainmentLevel(percent: number, target = 60) {
  if (percent >= target + 20) return 3;
  if (percent >= target + 10) return 2;
  if (percent >= target) return 1;
  return 0;
}

export function attainmentByOutcome(rows: AttainmentInput[]) {
  const map = new Map<string, { obtained: number; max: number }>();
  for (const row of rows) {
    const current = map.get(row.outcomeId) ?? { obtained: 0, max: 0 };
    current.obtained += row.obtained;
    current.max += row.max;
    map.set(row.outcomeId, current);
  }
  return [...map.entries()].map(([outcomeId, value]) => {
    const percent = percentage(value.obtained, value.max);
    return { outcomeId, percent, level: attainmentLevel(percent), ...value };
  });
}

/* ------------------------------------------------------------------ *
 * Numbering & verification
 * ------------------------------------------------------------------ */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function verificationCode(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function sequentialNumber(prefix: string, existing: string[], width = 5) {
  const numbers = existing
    .map((value) => Number(value.replace(prefix, "").replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}${String(next).padStart(width, "0")}`;
}

/* ------------------------------------------------------------------ *
 * Scheduling
 * ------------------------------------------------------------------ */

export function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export type ExamConflictKind = "student" | "faculty" | "room" | "backlog";

export interface ExamConflict {
  kind: ExamConflictKind;
  severity: "error" | "warning";
  message: string;
  examIds: string[];
}

export function seatLabel(prefix: string | null | undefined, index: number) {
  return `${prefix ?? "S"}${String(index + 1).padStart(3, "0")}`;
}

export function statusTone(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["published", "approved", "released", "completed", "registered", "eligible"].includes(status))
    return "default";
  if (["rejected", "cancelled", "ineligible", "withheld"].includes(status)) return "destructive";
  if (["draft", "planned", "pending", "pending_approval"].includes(status)) return "outline";
  return "secondary";
}
