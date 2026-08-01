import {
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  FileVideo,
  Link2,
  Notebook,
  Presentation,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Enum vocabularies (mirrors the database enums)
 * ------------------------------------------------------------------ */

export const publishStatuses = [
  "draft",
  "pending_approval",
  "scheduled",
  "published",
  "archived",
] as const;
export type PublishStatus = (typeof publishStatuses)[number];

export const nodeKinds = ["module", "chapter", "lesson", "topic"] as const;
export type NodeKind = (typeof nodeKinds)[number];

export const contentKinds = [
  "page",
  "note",
  "pdf",
  "ppt",
  "doc",
  "sheet",
  "image",
  "video",
  "audio",
  "zip",
  "link",
  "youtube",
  "drive",
  "other",
] as const;
export type ContentKind = (typeof contentKinds)[number];

export const planKinds = ["lesson", "weekly", "semester", "teaching"] as const;
export type PlanKind = (typeof planKinds)[number];

export const assignmentModes = ["individual", "group"] as const;
export const submissionChannels = ["online", "offline", "both"] as const;
export const submissionStatuses = [
  "draft",
  "submitted",
  "late",
  "returned",
  "graded",
  "resubmit",
] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const quizQuestionKinds = ["mcq", "msq", "subjective", "numerical", "coding"] as const;
export type QuizQuestionKind = (typeof quizQuestionKinds)[number];

export const attemptStatuses = ["in_progress", "submitted", "auto_submitted", "evaluated"] as const;
export const liveProviders = ["google_meet", "zoom", "teams", "other"] as const;
export const discussionKinds = ["question", "discussion", "announcement"] as const;
export const progressStates = ["not_started", "in_progress", "completed"] as const;

export function labelize(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function optionsOf<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: labelize(value) }));
}

export function statusTone(
  status: string | null | undefined,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "published":
    case "graded":
    case "completed":
    case "evaluated":
      return "default";
    case "draft":
    case "not_started":
    case "in_progress":
      return "outline";
    case "archived":
    case "resubmit":
    case "late":
      return "destructive";
    default:
      return "secondary";
  }
}

/* ------------------------------------------------------------------ *
 * Content helpers
 * ------------------------------------------------------------------ */

const CONTENT_ICONS: Record<ContentKind, LucideIcon> = {
  page: FileText,
  note: Notebook,
  pdf: FileType2,
  ppt: Presentation,
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  zip: FileArchive,
  link: Link2,
  youtube: Youtube,
  drive: FileText,
  other: FileText,
};

export function contentIcon(kind: string | null | undefined): LucideIcon {
  return CONTENT_ICONS[(kind ?? "page") as ContentKind] ?? FileText;
}

/** Infers a content kind from a file name or MIME type. */
export function inferContentKind(name: string, mime?: string | null): ContentKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("audio/")) return "audio";
  if (ext === "pdf") return "pdf";
  if (["ppt", "pptx", "key"].includes(ext)) return "ppt";
  if (["doc", "docx", "rtf", "odt"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  return "other";
}

/** A content or node row is visible to learners only when actually released. */
export function isReleased(
  status: string | null | undefined,
  scheduledAt: string | null | undefined,
  now = new Date(),
) {
  if (status === "published") return true;
  if (status === "scheduled" && scheduledAt) return new Date(scheduledAt) <= now;
  return false;
}

/* ------------------------------------------------------------------ *
 * Assignment helpers
 * ------------------------------------------------------------------ */

export function isLateSubmission(dueAt: string | null | undefined, submittedAt?: string | null) {
  if (!dueAt) return false;
  const when = submittedAt ? new Date(submittedAt) : new Date();
  return when > new Date(dueAt);
}

export function isWindowOpen(
  opensAt: string | null | undefined,
  closesAt: string | null | undefined,
  now = new Date(),
) {
  if (opensAt && new Date(opensAt) > now) return false;
  if (closesAt && new Date(closesAt) < now) return false;
  return true;
}

/** Applies the assignment late penalty to a raw mark. */
export function applyLatePenalty(marks: number, penaltyPercent: number, late: boolean) {
  if (!late || penaltyPercent <= 0) return round2(marks);
  return round2(Math.max(0, marks - (marks * penaltyPercent) / 100));
}

export interface RubricScoreInput {
  criterionId: string;
  points: number;
}

export function rubricTotal(scores: Record<string, number> | null | undefined) {
  if (!scores) return 0;
  return round2(Object.values(scores).reduce((sum, value) => sum + (Number(value) || 0), 0));
}

/* ------------------------------------------------------------------ *
 * Quiz scoring
 * ------------------------------------------------------------------ */

export interface QuizQuestionLike {
  id: string;
  kind: string;
  marks: number;
  negative_marks: number;
  answer_key: unknown;
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim().toLowerCase());
  if (value === null || value === undefined || value === "") return [];
  return [String(value).trim().toLowerCase()];
}

/** Auto-marks an objective response. Returns null for manually-graded kinds. */
export function gradeResponse(
  question: QuizQuestionLike,
  response: unknown,
): { correct: boolean; marks: number } | null {
  if (question.kind === "subjective" || question.kind === "coding") return null;
  const key = asArray(question.answer_key);
  const given = asArray(response);
  if (given.length === 0) return { correct: false, marks: 0 };
  const correct = key.length === given.length && key.every((entry) => given.includes(entry));
  return {
    correct,
    marks: correct ? Number(question.marks) || 0 : -(Number(question.negative_marks) || 0),
  };
}

export function scoreAttempt(
  questions: QuizQuestionLike[],
  responses: Record<string, unknown>,
): { score: number; total: number; autoGraded: number; pendingManual: number } {
  let score = 0;
  let total = 0;
  let autoGraded = 0;
  let pendingManual = 0;
  for (const question of questions) {
    total += Number(question.marks) || 0;
    const graded = gradeResponse(question, responses[question.id]);
    if (graded === null) {
      pendingManual += 1;
      continue;
    }
    autoGraded += 1;
    score += graded.marks;
  }
  return { score: round2(Math.max(0, score)), total: round2(total), autoGraded, pendingManual };
}

/** Deterministic shuffle so a student always sees the same order on resume. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    hash = (hash * 16807) % 2147483647;
    const swap = hash % (index + 1);
    const a = copy[index]!;
    const b = copy[swap]!;
    copy[index] = b;
    copy[swap] = a;
  }
  return copy;
}

/* ------------------------------------------------------------------ *
 * Progress
 * ------------------------------------------------------------------ */

export interface ProgressLike {
  state: string;
  progress_percent: number;
  time_spent_seconds: number;
}

export function completionPercent(total: number, rows: ProgressLike[]) {
  if (total <= 0) return 0;
  const completed = rows.filter((row) => row.state === "completed").length;
  return Math.round((completed / total) * 100);
}

export function formatDuration(seconds: number | null | undefined) {
  const value = Number(seconds) || 0;
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function round2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function percentage(obtained: number, max: number) {
  if (!max) return 0;
  return round2((obtained / max) * 100);
}

/** Simple engagement/risk signal used by the learning analytics screens. */
export function riskLevel(completion: number, submissionRate: number, quizAverage: number) {
  const composite = completion * 0.4 + submissionRate * 0.35 + quizAverage * 0.25;
  if (composite >= 75)
    return { label: "On track", tone: "default" as const, score: round2(composite) };
  if (composite >= 50)
    return { label: "Needs attention", tone: "secondary" as const, score: round2(composite) };
  return { label: "At risk", tone: "destructive" as const, score: round2(composite) };
}
