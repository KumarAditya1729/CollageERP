import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";
import {
  applyLatePenalty,
  isLateSubmission,
  percentage,
  scoreAttempt,
  seededShuffle,
  type QuizQuestionLike,
} from "@/lib/lms";

/* ------------------------------------------------------------------ *
 * Row shapes
 * ------------------------------------------------------------------ */

export interface WorkspaceRow extends Record<string, unknown> {
  id: string;
  course_id: string;
  section_id: string | null;
  academic_session_id: string | null;
  semester_id: string | null;
  faculty_id: string | null;
  title: string;
  summary: string | null;
  overview: string | null;
  banner_media_id: string | null;
  status: string;
}

export interface AnnouncementRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
}

export interface NodeRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  kind: string;
  title: string;
  description: string | null;
  position: number;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  duration_minutes: number | null;
  course_outcome_id: string | null;
  bloom_level: string | null;
  is_mandatory: boolean;
}

export interface ContentItemRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  node_id: string | null;
  library_item_id: string | null;
  media_asset_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  position: number;
  version: number;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  is_downloadable: boolean;
}

export interface LibraryItemRow extends Record<string, unknown> {
  id: string;
  folder_id: string | null;
  media_asset_id: string | null;
  title: string;
  description: string | null;
  kind: string;
  category: string | null;
  url: string | null;
  body: string | null;
  version: number;
  reuse_count: number;
}

export interface LessonPlanRow extends Record<string, unknown> {
  id: string;
  workspace_id: string | null;
  course_id: string;
  faculty_id: string | null;
  kind: string;
  title: string;
  week_number: number | null;
  planned_date: string | null;
  planned_hours: number | null;
  objectives: string | null;
  activities: string | null;
  resources: string | null;
  assessment: string | null;
  course_outcome_id: string | null;
  program_outcome_id: string | null;
  bloom_level: string | null;
  status: string;
  completed_at: string | null;
  ai_generated: boolean;
}

export interface AssignmentRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  course_id: string;
  node_id: string | null;
  rubric_id: string | null;
  title: string;
  instructions: string | null;
  mode: string;
  channel: string;
  max_marks: number;
  weightage: number;
  opens_at: string | null;
  due_at: string | null;
  closes_at: string | null;
  allow_late: boolean;
  late_penalty_percent: number;
  max_attempts: number;
  group_size: number | null;
  status: string;
  published_at: string | null;
}

export interface AssignmentGroupRow extends Record<string, unknown> {
  id: string;
  assignment_id: string;
  name: string;
  leader_student_id: string | null;
}

export interface SubmissionRow extends Record<string, unknown> {
  id: string;
  assignment_id: string;
  student_id: string;
  group_id: string | null;
  attempt_no: number;
  status: string;
  text_answer: string | null;
  link_url: string | null;
  submitted_at: string | null;
  is_late: boolean;
}

export interface GradeRow extends Record<string, unknown> {
  id: string;
  submission_id: string;
  assignment_id: string;
  marks: number | null;
  grade: string | null;
  feedback: string | null;
  rubric_scores: Record<string, number>;
  is_published: boolean;
  evaluated_at: string | null;
}

export interface QuizRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  course_id: string;
  node_id: string | null;
  title: string;
  instructions: string | null;
  total_marks: number;
  duration_minutes: number | null;
  negative_marking: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  pool_size: number | null;
  max_attempts: number;
  opens_at: string | null;
  closes_at: string | null;
  instant_result: boolean;
  pass_percent: number;
  status: string;
}

export interface QuizQuestionRow extends Record<string, unknown>, QuizQuestionLike {
  id: string;
  quiz_id: string;
  question_id: string | null;
  kind: string;
  body: string;
  options: { value: string; label: string }[];
  answer_key: string[];
  explanation: string | null;
  marks: number;
  negative_marks: number;
  pool_tag: string | null;
  bloom_level: string | null;
  difficulty: string | null;
  position: number;
}

export interface QuizAttemptRow extends Record<string, unknown> {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_no: number;
  status: string;
  question_order: string[];
  score: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number;
}

export interface QuizResponseRow extends Record<string, unknown> {
  id: string;
  attempt_id: string;
  quiz_question_id: string;
  response: string[];
  is_correct: boolean | null;
  marks_awarded: number;
  feedback: string | null;
}

export interface DiscussionRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  kind: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  is_resolved: boolean;
  resolved_post_id: string | null;
  reply_count: number;
  last_activity_at: string;
  created_by: string | null;
}

export interface DiscussionPostRow extends Record<string, unknown> {
  id: string;
  discussion_id: string;
  parent_id: string | null;
  body: string;
  mentions: string[];
  is_answer: boolean;
  is_hidden: boolean;
  created_at: string;
  created_by: string | null;
}

export interface LiveClassRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  timetable_entry_id: string | null;
  attendance_session_id: string | null;
  calendar_event_id: string | null;
  faculty_id: string | null;
  title: string;
  agenda: string | null;
  provider: string;
  join_url: string | null;
  recording_url: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
}

export interface ProgressRow extends Record<string, unknown> {
  id: string;
  workspace_id: string;
  node_id: string | null;
  content_item_id: string | null;
  student_id: string;
  state: string;
  progress_percent: number;
  time_spent_seconds: number;
  last_accessed_at: string;
  completed_at: string | null;
}

/* ------------------------------------------------------------------ *
 * Lists
 * ------------------------------------------------------------------ */

export function useWorkspaces() {
  return useResourceList<WorkspaceRow>({
    table: "lms_workspaces",
    select:
      "id, course_id, section_id, academic_session_id, semester_id, faculty_id, title, summary, overview, banner_media_id, status",
    orderBy: { column: "title" },
  });
}

export function useAnnouncements() {
  return useResourceList<AnnouncementRow>({
    table: "lms_announcements",
    select: "id, workspace_id, title, body, is_pinned, published_at",
    orderBy: { column: "published_at", ascending: false },
  });
}

export function useNodes() {
  return useResourceList<NodeRow>({
    table: "lms_nodes",
    select:
      "id, workspace_id, parent_id, kind, title, description, position, status, scheduled_at, published_at, duration_minutes, course_outcome_id, bloom_level, is_mandatory",
    orderBy: { column: "position" },
  });
}

export function useContentItems() {
  return useResourceList<ContentItemRow>({
    table: "lms_content_items",
    select:
      "id, workspace_id, node_id, library_item_id, media_asset_id, kind, title, body, url, file_name, file_size, mime_type, duration_seconds, position, version, status, scheduled_at, published_at, is_downloadable",
    orderBy: { column: "position" },
  });
}

export function useLibraryItems() {
  return useResourceList<LibraryItemRow>({
    table: "lms_library_items",
    select:
      "id, folder_id, media_asset_id, title, description, kind, category, url, body, version, reuse_count",
    orderBy: { column: "title" },
  });
}

export function useLessonPlans() {
  return useResourceList<LessonPlanRow>({
    table: "lms_lesson_plans",
    select:
      "id, workspace_id, course_id, faculty_id, kind, title, week_number, planned_date, planned_hours, objectives, activities, resources, assessment, course_outcome_id, program_outcome_id, bloom_level, status, completed_at, ai_generated",
    orderBy: { column: "week_number" },
  });
}

export function useAssignments() {
  return useResourceList<AssignmentRow>({
    table: "lms_assignments",
    select:
      "id, workspace_id, course_id, node_id, rubric_id, title, instructions, mode, channel, max_marks, weightage, opens_at, due_at, closes_at, allow_late, late_penalty_percent, max_attempts, group_size, status, published_at",
    orderBy: { column: "due_at", ascending: false },
  });
}

export function useAssignmentGroups() {
  return useResourceList<AssignmentGroupRow>({
    table: "lms_assignment_groups",
    select: "id, assignment_id, name, leader_student_id",
    orderBy: { column: "name" },
  });
}

export function useSubmissions() {
  return useResourceList<SubmissionRow>({
    table: "lms_submissions",
    select:
      "id, assignment_id, student_id, group_id, attempt_no, status, text_answer, link_url, submitted_at, is_late",
  });
}

export function useSubmissionGrades() {
  return useResourceList<GradeRow>({
    table: "lms_grades",
    select:
      "id, submission_id, assignment_id, marks, grade, feedback, rubric_scores, is_published, evaluated_at",
  });
}

export function useQuizzes() {
  return useResourceList<QuizRow>({
    table: "lms_quizzes",
    select:
      "id, workspace_id, course_id, node_id, title, instructions, total_marks, duration_minutes, negative_marking, shuffle_questions, shuffle_options, pool_size, max_attempts, opens_at, closes_at, instant_result, pass_percent, status",
    orderBy: { column: "title" },
  });
}

export function useQuizQuestions() {
  return useResourceList<QuizQuestionRow>({
    table: "lms_quiz_questions",
    select:
      "id, quiz_id, question_id, kind, body, options, answer_key, explanation, marks, negative_marks, pool_tag, bloom_level, difficulty, position",
    orderBy: { column: "position" },
  });
}

export function useQuizAttempts() {
  return useResourceList<QuizAttemptRow>({
    table: "lms_quiz_attempts",
    select:
      "id, quiz_id, student_id, attempt_no, status, question_order, score, percentage, is_passed, started_at, submitted_at, time_spent_seconds",
  });
}

export function useDiscussions() {
  return useResourceList<DiscussionRow>({
    table: "lms_discussions",
    select:
      "id, workspace_id, kind, title, body, is_pinned, is_locked, is_resolved, resolved_post_id, reply_count, last_activity_at, created_by",
    orderBy: { column: "last_activity_at", ascending: false },
  });
}

export function useLiveClasses() {
  return useResourceList<LiveClassRow>({
    table: "lms_live_classes",
    select:
      "id, workspace_id, timetable_entry_id, attendance_session_id, calendar_event_id, faculty_id, title, agenda, provider, join_url, recording_url, scheduled_start, scheduled_end, status",
    orderBy: { column: "scheduled_start", ascending: false },
  });
}

export function useProgressRows() {
  return useResourceList<ProgressRow>({
    table: "lms_progress",
    select:
      "id, workspace_id, node_id, content_item_id, student_id, state, progress_percent, time_spent_seconds, last_accessed_at, completed_at",
    softDelete: false,
  });
}

/* ------------------------------------------------------------------ *
 * Scoped reads
 * ------------------------------------------------------------------ */

export function useDiscussionPosts(discussionId: string | undefined) {
  return useQuery({
    queryKey: ["lms-discussion-posts", discussionId],
    enabled: Boolean(discussionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_discussion_posts" as never)
        .select(
          "id, discussion_id, parent_id, body, mentions, is_answer, is_hidden, created_at, created_by",
        )
        .eq("discussion_id", discussionId!)
        .is("deleted_at", null)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as DiscussionPostRow[];
    },
  });
}

export function useAttemptResponses(attemptId: string | undefined) {
  return useQuery({
    queryKey: ["lms-quiz-responses", attemptId],
    enabled: Boolean(attemptId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_quiz_responses" as never)
        .select("id, attempt_id, quiz_question_id, response, is_correct, marks_awarded, feedback")
        .eq("attempt_id", attemptId!);
      if (error) throw error;
      return (data ?? []) as unknown as QuizResponseRow[];
    },
  });
}

export function useSubmissionFiles(submissionId: string | undefined) {
  return useQuery({
    queryKey: ["lms-submission-files", submissionId],
    enabled: Boolean(submissionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_submission_files" as never)
        .select("id, submission_id, storage_bucket, storage_path, file_name, file_size, mime_type")
        .eq("submission_id", submissionId!);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        storage_bucket: string;
        storage_path: string;
        file_name: string;
        file_size: number | null;
        mime_type: string | null;
      }[];
    },
  });
}

/** Resolves the signed-in user's student record, when they are a learner. */
export function useMyStudent() {
  const { user } = useAuth();
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lms-my-student", user?.id, tenant?.id],
    enabled: Boolean(user?.id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, roll_number, program_id, current_semester_id, section_id",
        )
        .eq("tenant_id", tenant!.id)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Resolves the signed-in user's faculty record, when they teach. */
export function useMyFaculty() {
  const { user } = useAuth();
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lms-my-faculty", user?.id, tenant?.id],
    enabled: Boolean(user?.id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty")
        .select("id, first_name, last_name, department_id")
        .eq("tenant_id", tenant!.id)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

function useInvalidate() {
  const queryClient = useQueryClient();
  return (tables: string[]) => {
    for (const table of tables) {
      void queryClient.invalidateQueries({ queryKey: ["resource", table] });
    }
    void queryClient.invalidateQueries({ queryKey: ["lms-discussion-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["lms-quiz-responses"] });
    void queryClient.invalidateQueries({ queryKey: ["lms-submission-files"] });
  };
}

/** Publishes, schedules or archives any LMS record that carries a status column. */
export function usePublishRecord(table: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      scheduledAt,
    }: {
      id: string;
      status: string;
      scheduledAt?: string | null;
    }) => {
      const values: Record<string, unknown> = { status };
      if (status === "published") values["published_at"] = new Date().toISOString();
      if (scheduledAt !== undefined) values["scheduled_at"] = scheduledAt;
      const { error } = await supabase
        .from(table as never)
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "published"
          ? "Published to learners"
          : `Marked as ${variables.status}`,
      );
      invalidate([table]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderNodes() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("lms_nodes" as never)
          .update({ position: update.position } as never)
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate(["lms_nodes"]),
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Snapshots a content item before an edit so every change is versioned. */
export function useVersionContent() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ item, note }: { item: ContentItemRow; note?: string }) => {
      const nextVersion = (item.version ?? 1) + 1;
      const { error: versionError } = await supabase.from("lms_content_versions" as never).insert({
        tenant_id: tenant?.id,
        content_item_id: item.id,
        version: item.version ?? 1,
        snapshot: item as unknown as Record<string, unknown>,
        note: note ?? null,
        changed_by: user?.id,
      } as never);
      if (versionError) throw versionError;
      const { error } = await supabase
        .from("lms_content_items" as never)
        .update({ version: nextVersion } as never)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Version snapshot saved");
      invalidate(["lms_content_items"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Copies a reusable library asset into a course as a content item. */
export function useAddFromLibrary() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      item,
      workspaceId,
      nodeId,
    }: {
      item: LibraryItemRow;
      workspaceId: string;
      nodeId: string | null;
    }) => {
      const { error } = await supabase.from("lms_content_items" as never).insert({
        tenant_id: tenant?.id,
        workspace_id: workspaceId,
        node_id: nodeId,
        library_item_id: item.id,
        media_asset_id: item.media_asset_id,
        kind: item.kind,
        title: item.title,
        body: item.body,
        url: item.url,
        status: "draft",
        created_by: user?.id,
      } as never);
      if (error) throw error;
      const { error: countError } = await supabase
        .from("lms_library_items" as never)
        .update({ reuse_count: (item.reuse_count ?? 0) + 1 } as never)
        .eq("id", item.id);
      if (countError) throw countError;
    },
    onSuccess: () => {
      toast.success("Added to the course");
      invalidate(["lms_content_items", "lms_library_items"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------------------- assignments --------------------------- */

export function useSubmitAssignment() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      assignment,
      studentId,
      attemptNo,
      textAnswer,
      linkUrl,
      files,
      asDraft,
    }: {
      assignment: AssignmentRow;
      studentId: string;
      attemptNo: number;
      textAnswer: string | null;
      linkUrl: string | null;
      files: File[];
      asDraft: boolean;
    }) => {
      const now = new Date().toISOString();
      const late = isLateSubmission(assignment.due_at, now);
      if (!asDraft && late && !assignment.allow_late) {
        throw new Error("The due date has passed and late submissions are not allowed.");
      }
      const { data, error } = await supabase
        .from("lms_submissions" as never)
        .upsert(
          {
            tenant_id: tenant?.id,
            assignment_id: assignment.id,
            student_id: studentId,
            attempt_no: attemptNo,
            status: asDraft ? "draft" : late ? "late" : "submitted",
            text_answer: textAnswer,
            link_url: linkUrl,
            submitted_at: asDraft ? null : now,
            is_late: asDraft ? false : late,
            submitted_by: user?.id,
            created_by: user?.id,
          } as never,
          { onConflict: "assignment_id,student_id,attempt_no" } as never,
        )
        .select("id")
        .single();
      if (error) throw error;
      const submissionId = (data as unknown as { id: string }).id;

      for (const file of files) {
        const path = `${tenant?.id}/lms/${assignment.id}/${submissionId}/${Date.now()}-${file.name}`;
        const upload = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (upload.error) throw upload.error;
        const { error: fileError } = await supabase.from("lms_submission_files" as never).insert({
          tenant_id: tenant?.id,
          submission_id: submissionId,
          storage_bucket: "documents",
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          created_by: user?.id,
        } as never);
        if (fileError) throw fileError;
      }
      return submissionId;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.asDraft ? "Draft saved" : "Submitted for evaluation");
      invalidate(["lms_submissions"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useGradeSubmission() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      submission,
      assignment,
      marks,
      feedback,
      rubricScores,
      publish,
      returnForRework,
    }: {
      submission: SubmissionRow;
      assignment: AssignmentRow;
      marks: number;
      feedback: string | null;
      rubricScores?: Record<string, number>;
      publish: boolean;
      returnForRework?: boolean;
    }) => {
      const effective = applyLatePenalty(
        marks,
        assignment.late_penalty_percent ?? 0,
        Boolean(submission.is_late),
      );
      const { error } = await supabase.from("lms_grades" as never).upsert(
        {
          tenant_id: tenant?.id,
          submission_id: submission.id,
          assignment_id: assignment.id,
          marks: effective,
          feedback,
          rubric_scores: rubricScores ?? {},
          is_published: publish,
          evaluated_by: user?.id,
          evaluated_at: new Date().toISOString(),
          created_by: user?.id,
        } as never,
        { onConflict: "submission_id" } as never,
      );
      if (error) throw error;

      const { error: statusError } = await supabase
        .from("lms_submissions" as never)
        .update({ status: returnForRework ? "resubmit" : "graded" } as never)
        .eq("id", submission.id);
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      toast.success("Evaluation saved");
      invalidate(["lms_submissions", "lms_grades"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ------------------------------ quizzes ----------------------------- */

export function useStartAttempt() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      quiz,
      questions,
      studentId,
      attemptNo,
    }: {
      quiz: QuizRow;
      questions: QuizQuestionRow[];
      studentId: string;
      attemptNo: number;
    }) => {
      const seed = `${quiz.id}:${studentId}:${attemptNo}`;
      let ordered = quiz.shuffle_questions ? seededShuffle(questions, seed) : questions;
      if (quiz.pool_size && quiz.pool_size > 0) ordered = ordered.slice(0, quiz.pool_size);
      const { data, error } = await supabase
        .from("lms_quiz_attempts" as never)
        .insert({
          tenant_id: tenant?.id,
          quiz_id: quiz.id,
          student_id: studentId,
          attempt_no: attemptNo,
          status: "in_progress",
          question_order: ordered.map((question) => question.id),
          started_at: new Date().toISOString(),
          created_by: user?.id,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as unknown as { id: string }).id;
    },
    onSuccess: () => invalidate(["lms_quiz_attempts"]),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitAttempt() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      attemptId,
      quiz,
      questions,
      responses,
      timeSpent,
      auto,
    }: {
      attemptId: string;
      quiz: QuizRow;
      questions: QuizQuestionRow[];
      responses: Record<string, string[]>;
      timeSpent: number;
      auto?: boolean;
    }) => {
      const rows = questions.map((question) => {
        const graded = gradeOne(question, responses[question.id] ?? []);
        return {
          tenant_id: tenant?.id,
          attempt_id: attemptId,
          quiz_question_id: question.id,
          response: responses[question.id] ?? [],
          is_correct: graded?.correct ?? null,
          marks_awarded: graded?.marks ?? 0,
        };
      });
      const { error: responseError } = await supabase
        .from("lms_quiz_responses" as never)
        .upsert(rows as never, { onConflict: "attempt_id,quiz_question_id" } as never);
      if (responseError) throw responseError;

      const summary = scoreAttempt(questions, responses);
      const pct = percentage(summary.score, summary.total || quiz.total_marks || 1);
      const { error } = await supabase
        .from("lms_quiz_attempts" as never)
        .update({
          status: summary.pendingManual > 0 ? "submitted" : "evaluated",
          score: summary.score,
          percentage: pct,
          is_passed: summary.pendingManual > 0 ? null : pct >= (quiz.pass_percent ?? 40),
          submitted_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
        } as never)
        .eq("id", attemptId);
      if (error) throw error;
      return { ...summary, percentage: pct, auto: Boolean(auto) };
    },
    onSuccess: (result) => {
      toast.success(
        result.pendingManual > 0
          ? "Submitted — descriptive answers await evaluation"
          : `Submitted — scored ${result.score}/${result.total}`,
      );
      invalidate(["lms_quiz_attempts"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function gradeOne(question: QuizQuestionRow, response: string[]) {
  if (question.kind === "subjective" || question.kind === "coding") return null;
  const key = (question.answer_key ?? []).map((entry) => String(entry).trim().toLowerCase());
  const given = response.map((entry) => String(entry).trim().toLowerCase());
  if (given.length === 0) return { correct: false, marks: 0 };
  const correct = key.length === given.length && key.every((entry) => given.includes(entry));
  return {
    correct,
    marks: correct ? Number(question.marks) || 0 : -(Number(question.negative_marks) || 0),
  };
}

/** Manual marking for descriptive and coding responses. */
export function useEvaluateResponse() {
  const { user } = useAuth();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      responseId,
      marks,
      feedback,
    }: {
      responseId: string;
      marks: number;
      feedback: string | null;
    }) => {
      const { error } = await supabase
        .from("lms_quiz_responses" as never)
        .update({ marks_awarded: marks, feedback, evaluated_by: user?.id } as never)
        .eq("id", responseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response evaluated");
      invalidate(["lms_quiz_attempts"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------------------- discussions --------------------------- */

export function useDiscussionMutations() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  const reply = useMutation({
    mutationFn: async ({
      discussion,
      body,
      parentId,
      mentions,
    }: {
      discussion: DiscussionRow;
      body: string;
      parentId?: string | null;
      mentions?: string[];
    }) => {
      const { error } = await supabase.from("lms_discussion_posts" as never).insert({
        tenant_id: tenant?.id,
        discussion_id: discussion.id,
        parent_id: parentId ?? null,
        body,
        mentions: mentions ?? [],
        created_by: user?.id,
      } as never);
      if (error) throw error;
      const { error: threadError } = await supabase
        .from("lms_discussions" as never)
        .update({
          reply_count: (discussion.reply_count ?? 0) + 1,
          last_activity_at: new Date().toISOString(),
        } as never)
        .eq("id", discussion.id);
      if (threadError) throw threadError;
    },
    onSuccess: () => invalidate(["lms_discussions"]),
    onError: (error: Error) => toast.error(error.message),
  });

  const moderate = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("lms_discussions" as never)
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thread updated");
      invalidate(["lms_discussions"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const markAnswer = useMutation({
    mutationFn: async ({ discussionId, postId }: { discussionId: string; postId: string }) => {
      const { error } = await supabase
        .from("lms_discussion_posts" as never)
        .update({ is_answer: true } as never)
        .eq("id", postId);
      if (error) throw error;
      const { error: threadError } = await supabase
        .from("lms_discussions" as never)
        .update({ is_resolved: true, resolved_post_id: postId } as never)
        .eq("id", discussionId);
      if (threadError) throw threadError;
    },
    onSuccess: () => {
      toast.success("Marked as the answer");
      invalidate(["lms_discussions"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { reply, moderate, markAnswer };
}

/* ------------------------------ progress ---------------------------- */

export function useTrackProgress() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      nodeId,
      contentItemId,
      studentId,
      state,
      progressPercent,
      timeSpentSeconds,
    }: {
      workspaceId: string;
      nodeId: string | null;
      contentItemId: string | null;
      studentId: string;
      state: string;
      progressPercent: number;
      timeSpentSeconds: number;
    }) => {
      const { data: existing, error: readError } = await supabase
        .from("lms_progress" as never)
        .select("id, time_spent_seconds")
        .eq("student_id", studentId)
        .eq("workspace_id", workspaceId)
        .eq(contentItemId ? "content_item_id" : "node_id", (contentItemId ?? nodeId) as string)
        .maybeSingle();
      if (readError) throw readError;

      const payload = {
        tenant_id: tenant?.id,
        workspace_id: workspaceId,
        node_id: nodeId,
        content_item_id: contentItemId,
        student_id: studentId,
        state,
        progress_percent: progressPercent,
        last_accessed_at: new Date().toISOString(),
        completed_at: state === "completed" ? new Date().toISOString() : null,
        created_by: user?.id,
      };

      if (existing) {
        const row = existing as unknown as { id: string; time_spent_seconds: number };
        const { error } = await supabase
          .from("lms_progress" as never)
          .update({
            ...payload,
            time_spent_seconds: (row.time_spent_seconds ?? 0) + timeSpentSeconds,
          } as never)
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lms_progress" as never)
          .insert({ ...payload, time_spent_seconds: timeSpentSeconds } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate(["lms_progress"]),
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ------------------------------------------------------------------ *
 * Aggregates
 * ------------------------------------------------------------------ */

export function useLmsOverview() {
  const workspaces = useWorkspaces();
  const assignments = useAssignments();
  const submissions = useSubmissions();
  const grades = useSubmissionGrades();
  const quizzes = useQuizzes();
  const attempts = useQuizAttempts();
  const discussions = useDiscussions();
  const live = useLiveClasses();
  const content = useContentItems();
  const progress = useProgressRows();

  const loading =
    workspaces.isLoading ||
    assignments.isLoading ||
    submissions.isLoading ||
    quizzes.isLoading ||
    attempts.isLoading;

  const stats = useMemo(() => {
    const submissionRows = submissions.data ?? [];
    const gradeRows = grades.data ?? [];
    const attemptRows = attempts.data ?? [];
    const gradedIds = new Set(gradeRows.map((row) => row.submission_id));
    const pendingEvaluation = submissionRows.filter(
      (row) => ["submitted", "late"].includes(row.status) && !gradedIds.has(row.id),
    ).length;
    const quizAverage =
      attemptRows.length === 0
        ? 0
        : Math.round(
            attemptRows.reduce((sum, row) => sum + (row.percentage ?? 0), 0) / attemptRows.length,
          );
    const now = new Date();
    const upcomingLive = (live.data ?? []).filter(
      (row) => new Date(row.scheduled_start) >= now,
    ).length;

    return {
      workspaces: (workspaces.data ?? []).length,
      publishedWorkspaces: (workspaces.data ?? []).filter((row) => row.status === "published")
        .length,
      contentItems: (content.data ?? []).length,
      assignments: (assignments.data ?? []).length,
      submissions: submissionRows.length,
      pendingEvaluation,
      quizzes: (quizzes.data ?? []).length,
      attempts: attemptRows.length,
      quizAverage,
      discussions: (discussions.data ?? []).length,
      unresolved: (discussions.data ?? []).filter(
        (row) => row.kind === "question" && !row.is_resolved,
      ).length,
      upcomingLive,
      completions: (progress.data ?? []).filter((row) => row.state === "completed").length,
    };
  }, [
    workspaces.data,
    assignments.data,
    submissions.data,
    grades.data,
    quizzes.data,
    attempts.data,
    discussions.data,
    live.data,
    content.data,
    progress.data,
  ]);

  return { stats, loading };
}
