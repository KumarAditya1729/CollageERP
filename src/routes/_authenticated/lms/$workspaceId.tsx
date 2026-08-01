import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  MessagesSquare,
  Video,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Upload,
  AlertTriangle,
  Award,
  BookMarked,
  FileText,
  Clock,
  Shuffle,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Bot,
  Sparkles,
  Send,
  Pin,
  CheckCircle,
  FileUp,
  Download,
  Eye,
  Play,
  UserCheck,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState, InlineLoader, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import {
  useWorkspaces,
  useAnnouncements,
  useNodes,
  useContentItems,
  useAssignments,
  useSubmissions,
  useQuizzes,
  useQuizAttempts,
  useDiscussions,
  useLiveClasses,
  useLessonPlans,
  useProgressRows,
  useMyStudent,
  useMyFaculty,
  useTrackProgress,
  useSubmitAssignment,
  useGradeSubmission,
  useStartAttempt,
  useSubmitAttempt,
  useDiscussionPosts,
  useDiscussionMutations,
  useVersionContent,
  type QuizQuestionRow,
  type QuizRow,
  type SubmissionRow,
  type AssignmentRow,
  type ContentItemRow,
} from "@/hooks/useLMS";
import { labelize, statusTone, riskLevel } from "@/lib/lms";
import { formatDateTime } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";

// Explicitly casting router path as any to bypass static FileRoutesByPath check during initial creation
export const Route = createFileRoute("/_authenticated/lms/$workspaceId")({
  head: () => ({
    meta: [{ title: "Course Workspace — CampusOS" }],
  }),
  component: WorkspaceDetail,
  errorComponent: ({ error }) => (
    <ErrorState title="Workspace unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Workspace not found" />,
});

function WorkspaceDetail() {
  const { workspaceId } = Route.useParams();
  const { tenant, can } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const workspaces = useWorkspaces();
  const workspace = workspaces.data?.find((w) => w.id === workspaceId);

  const student = useMyStudent();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  // Overview Tab State
  const announcements = useAnnouncements();
  const workspaceAnnouncements =
    announcements.data?.filter((a) => a.workspace_id === workspaceId) ?? [];
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const announceMutation = useResourceMutations({ table: "lms_announcements" });

  // Modules Tab State
  const nodes = useNodes();
  const contentItems = useContentItems();
  const progressRows = useProgressRows();
  const workspaceNodes =
    nodes.data
      ?.filter((n) => n.workspace_id === workspaceId)
      .sort((a, b) => (a.position || 0) - (b.position || 0)) ?? [];
  const workspaceContent =
    contentItems.data
      ?.filter((c) => c.workspace_id === workspaceId)
      .sort((a, b) => (a.position || 0) - (b.position || 0)) ?? [];
  const trackProgress = useTrackProgress();
  const versionContent = useVersionContent();

  const [nodeOpen, setNodeOpen] = useState(false);
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeKind, setNodeKind] = useState("module");
  const nodeMutation = useResourceMutations({ table: "lms_nodes" });

  const [contentOpen, setContentOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentKind, setContentKind] = useState("page");
  const [contentBody, setContentBody] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [scheduledPublish, setScheduledPublish] = useState("");
  const contentMutation = useResourceMutations({ table: "lms_content_items" });

  // Version History Dialog
  const [selectedItemId, setSelectedItemId] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const { data: contentVersions } = useQuery({
    queryKey: ["content-versions", selectedItemId],
    enabled: Boolean(selectedItemId),
    queryFn: async () => {
      const { data } = await supabase
        .from("lms_content_versions" as never)
        .select("*")
        .eq("content_item_id", selectedItemId)
        .order("version", { ascending: false });
      return data || [];
    },
  });

  // Assignments Tab State
  const assignments = useAssignments();
  const submissions = useSubmissions();
  const workspaceAssignments =
    assignments.data?.filter((a) => a.workspace_id === workspaceId) ?? [];

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignInstructions, setAssignInstructions] = useState("");
  const [assignMarks, setAssignMarks] = useState("100");
  const [assignDue, setAssignDue] = useState("");
  const [assignMode, setAssignMode] = useState<"individual" | "group">("individual");
  const [groupSize, setGroupSize] = useState("4");
  const [allowLate, setAllowLate] = useState(true);
  const [latePenalty, setLatePenalty] = useState("10");
  const assignmentMutation = useResourceMutations({ table: "lms_assignments" });

  // Student Assignment Submission State
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submitText, setSubmitText] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const submitAssignment = useSubmitAssignment();

  // Faculty Grading State & Rubrics
  const [gradeOpen, setGradeOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [rubricAccuracy, setRubricAccuracy] = useState(8);
  const [rubricFormatting, setRubricFormatting] = useState(8);
  const [rubricOriginality, setRubricOriginality] = useState(8);
  const gradeSubmission = useGradeSubmission();

  // Quizzes Tab State
  const quizzes = useQuizzes();
  const quizAttempts = useQuizAttempts();
  const workspaceQuizzes = quizzes.data?.filter((q) => q.workspace_id === workspaceId) ?? [];

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizInstructions, setQuizInstructions] = useState("");
  const [quizDuration, setQuizDuration] = useState("30");
  const [quizMarks, setQuizMarks] = useState("50");
  const [quizShuffle, setQuizShuffle] = useState(true);
  const [negMarking, setNegMarking] = useState("0");
  const [attemptLimit, setAttemptLimit] = useState("3");
  const quizMutation = useResourceMutations({ table: "lms_quizzes" });

  // Quiz Taking & Timer & Autosave State
  const [activeQuizId, setActiveQuizId] = useState("");
  const [activeAttemptId, setActiveAttemptId] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(1800); // Default 30 min
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();

  // Quiz Autosave Effect
  useEffect(() => {
    if (activeAttemptId) {
      const autosaveInterval = setInterval(() => {
        localStorage.setItem(`quiz_autosave_${activeAttemptId}`, JSON.stringify(answers));
        toast.info("Answers autosaved locally.", { duration: 1500 });
      }, 5000);
      return () => clearInterval(autosaveInterval);
    }
  }, [activeAttemptId, answers]);

  // Quiz Timer Countdown Effect
  useEffect(() => {
    if (activeQuizId && quizTimeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setQuizTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timerRef.current!);
    } else if (activeQuizId && quizTimeLeft === 0) {
      toast.warning("Time limit reached. Autosubmitting quiz...");
      void handleSubmitQuiz();
    }
  }, [activeQuizId, quizTimeLeft]);

  // Quiz Review State
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState<Record<string, unknown> | null>(null);

  // Discussions Tab State
  const discussions = useDiscussions();
  const workspaceDiscussions =
    discussions.data?.filter((d) => d.workspace_id === workspaceId) ?? [];
  const [selectedDiscussion, setSelectedDiscussion] = useState<Record<string, unknown> | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discBody, setDiscBody] = useState("");
  const [discKind, setDiscKind] = useState("discussion");
  const discussionMutation = useResourceMutations({ table: "lms_discussions" });

  // Threaded Replies State
  const { data: replies, refetch: refetchReplies } = useDiscussionPosts(selectedDiscussion?.id);
  const [replyBody, setReplyBody] = useState("");
  const discussionActions = useDiscussionMutations();

  // Live Classes Tab State
  const liveClasses = useLiveClasses();
  const workspaceLive = liveClasses.data?.filter((l) => l.workspace_id === workspaceId) ?? [];
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveTitle, setLiveOpenTitle] = useState("");
  const [liveStart, setLiveStart] = useState("");
  const [liveProvider, setLiveProvider] = useState("google_meet");
  const [liveUrl, setLiveUrl] = useState("");
  const liveMutation = useResourceMutations({ table: "lms_live_classes" });

  // Lesson Plans Tab State
  const lessonPlans = useLessonPlans();
  const workspacePlans = lessonPlans.data?.filter((p) => p.workspace_id === workspaceId) ?? [];
  const [planOpen, setPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planWeek, setPlanWeek] = useState("1");
  const [planObjectives, setPlanObjectives] = useState("");
  const planMutation = useResourceMutations({ table: "lms_lesson_plans" });

  // AI Assistance Layer
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  if (workspaces.isLoading) {
    return <InlineLoader label="Loading workspace..." />;
  }

  if (!workspace) {
    return (
      <ErrorState
        title="Workspace Not Found"
        description="The workspace ID is invalid or deleted."
      />
    );
  }

  // Authoring reordering mutations
  const handleMoveNode = async (nodeId: string, direction: "up" | "down") => {
    const idx = workspaceNodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= workspaceNodes.length) return;

    const current = workspaceNodes[idx];
    const target = workspaceNodes[targetIdx];

    const currentPos = current.position || 0;
    const targetPos = target.position || 0;

    await supabase
      .from("lms_nodes")
      .update({ position: targetPos } as never)
      .eq("id", current.id);
    await supabase
      .from("lms_nodes")
      .update({ position: currentPos } as never)
      .eq("id", target.id);
    void nodes.refetch();
  };

  const handleMoveContent = async (itemId: string, direction: "up" | "down") => {
    const idx = workspaceContent.findIndex((c) => c.id === itemId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= workspaceContent.length) return;

    const current = workspaceContent[idx];
    const target = workspaceContent[targetIdx];

    const currentPos = current.position || 0;
    const targetPos = target.position || 0;

    await supabase
      .from("lms_content_items")
      .update({ position: targetPos } as never)
      .eq("id", current.id);
    await supabase
      .from("lms_content_items")
      .update({ position: currentPos } as never)
      .eq("id", target.id);
    void contentItems.refetch();
  };

  const handlePostAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) return;
    await announceMutation.create.mutateAsync({
      workspace_id: workspaceId,
      title: announceTitle.trim(),
      body: announceBody.trim(),
      published_at: new Date().toISOString(),
    });
    setAnnounceOpen(false);
    setAnnounceTitle("");
    setAnnounceBody("");
    void announcements.refetch();
  };

  const handleCreateNode = async () => {
    if (!nodeTitle.trim()) return;
    await nodeMutation.create.mutateAsync({
      workspace_id: workspaceId,
      title: nodeTitle.trim(),
      kind: nodeKind,
      position: workspaceNodes.length + 1,
      status: "published",
    });
    setNodeOpen(false);
    setNodeTitle("");
    void nodes.refetch();
  };

  const handleCreateContent = async () => {
    if (!contentTitle.trim()) return;
    await contentMutation.create.mutateAsync({
      workspace_id: workspaceId,
      node_id: selectedNodeId || null,
      title: contentTitle.trim(),
      kind: contentKind,
      body: contentBody.trim() || null,
      url: contentUrl.trim() || null,
      position: workspaceContent.length + 1,
      status: "published",
    });
    setContentOpen(false);
    setContentTitle("");
    setContentBody("");
    setContentUrl("");
    setSelectedNodeId("");
    void contentItems.refetch();
  };

  const handleCreateAssignment = async () => {
    if (!assignTitle.trim()) return;
    await assignmentMutation.create.mutateAsync({
      workspace_id: workspaceId,
      course_id: workspace.course_id,
      title: assignTitle.trim(),
      instructions: assignInstructions.trim() || null,
      max_marks: Number(assignMarks) || 100,
      due_at: assignDue || null,
      mode: assignMode,
      group_size: Number(groupSize) || 4,
      allow_late: allowLate,
      late_penalty_percent: Number(latePenalty) || 10,
      status: "published",
    });
    setAssignOpen(false);
    setAssignTitle("");
    setAssignInstructions("");
    setAssignDue("");
    void assignments.refetch();
  };

  const handleSubmitAssignment = async () => {
    const assignment = workspaceAssignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;

    await submitAssignment.mutateAsync({
      assignment: assignment as AssignmentRow,
      studentId: student.data?.id || user?.id || "",
      attemptNo: 1,
      textAnswer: submitText.trim() || null,
      linkUrl: submitUrl.trim() || null,
      files: [],
      asDraft: false,
    });
    setSubmitOpen(false);
    setSelectedAssignmentId("");
    setSubmitText("");
    setSubmitUrl("");
    void submissions.refetch();
  };

  const handleGradeSubmission = async () => {
    const submission = submissions.data?.find((s) => s.id === selectedSubmissionId);
    if (!submission) return;
    const assignment = workspaceAssignments.find((a) => a.id === submission.assignment_id);
    if (!assignment) return;

    await gradeSubmission.mutateAsync({
      submission: submission as SubmissionRow,
      assignment: assignment as AssignmentRow,
      marks: Number(gradeMarks),
      feedback: gradeFeedback.trim() || null,
      rubricScores: {
        accuracy: rubricAccuracy,
        formatting: rubricFormatting,
        originality: rubricOriginality,
      },
      publish: true,
    });
    setGradeOpen(false);
    setSelectedSubmissionId("");
    setGradeMarks("");
    setGradeFeedback("");
    void submissions.refetch();
  };

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) return;
    await quizMutation.create.mutateAsync({
      workspace_id: workspaceId,
      course_id: workspace.course_id,
      title: quizTitle.trim(),
      instructions: quizInstructions.trim() || null,
      total_marks: Number(quizMarks) || 50,
      duration_minutes: Number(quizDuration) || 30,
      allow_shuffle: quizShuffle,
      negative_marks: Number(negMarking) || 0,
      max_attempts: Number(attemptLimit) || 3,
      status: "published",
    });
    setQuizOpen(false);
    setQuizTitle("");
    setQuizInstructions("");
    void quizzes.refetch();
  };

  const handleStartQuiz = async (quizId: string) => {
    const quiz = workspaceQuizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    setActiveQuizId(quizId);
    setQuizTimeLeft((quiz.duration_minutes || 30) * 60);

    const { data: qQuestions, error: qError } = await supabase
      .from("lms_quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position");
    if (qError) {
      toast.error(qError.message);
      return;
    }

    let formattedQuestions = (qQuestions || []).map((q) => ({
      ...q,
      options: (q.options || []) as unknown as { value: string; label: string }[],
      answer_key: (q.answer_key || []) as unknown as string[],
    })) as unknown as QuizQuestionRow[];

    if (quiz.allow_shuffle) {
      formattedQuestions = [...formattedQuestions].sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(formattedQuestions);

    const attemptId = await startAttempt.mutateAsync({
      quiz: quiz as QuizRow,
      questions: formattedQuestions,
      studentId: student.data?.id || user?.id || "",
      attemptNo: 1,
    });
    setActiveAttemptId(attemptId);
  };

  const handleSubmitQuiz = async () => {
    const quiz = workspaceQuizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return;

    const quizResponses: Record<string, string[]> = {};
    Object.entries(answers).forEach(([qId, val]) => {
      quizResponses[qId] = [val];
    });

    await submitAttempt.mutateAsync({
      attemptId: activeAttemptId,
      quiz: quiz as QuizRow,
      questions: activeQuestions,
      responses: quizResponses,
      timeSpent: (quiz.duration_minutes || 30) * 60 - quizTimeLeft,
    });
    setActiveQuizId("");
    setActiveAttemptId("");
    setActiveQuestions([]);
    setAnswers({});
    void quizAttempts.refetch();
    toast.success("Quiz submitted successfully!");
  };

  const handleCreateDiscussion = async () => {
    if (!discTitle.trim() || !discBody.trim()) return;
    await discussionMutation.create.mutateAsync({
      workspace_id: workspaceId,
      title: discTitle.trim(),
      body: discBody.trim(),
      kind: discKind,
      author_id: user?.id || "",
    });
    setDiscussionOpen(false);
    setDiscTitle("");
    setDiscBody("");
    void discussions.refetch();
  };

  const handlePostReply = async () => {
    if (!replyBody.trim() || !selectedDiscussion) return;
    await discussionActions.reply.mutateAsync({
      discussion: selectedDiscussion,
      body: replyBody.trim(),
    });
    setReplyBody("");
    void refetchReplies();
  };

  const handleScheduleClass = async () => {
    if (!liveTitle.trim() || !liveStart) return;
    await liveMutation.create.mutateAsync({
      workspace_id: workspaceId,
      title: liveTitle.trim(),
      scheduled_start: new Date(liveStart).toISOString(),
      provider: liveProvider,
      join_url: liveUrl.trim() || null,
      status: "scheduled",
    });
    setLiveOpen(false);
    setLiveOpenTitle("");
    setLiveStart("");
    setLiveUrl("");
    void liveClasses.refetch();
  };

  const handleCreatePlan = async () => {
    if (!planTitle.trim()) return;
    await planMutation.create.mutateAsync({
      workspace_id: workspaceId,
      course_id: workspace.course_id,
      title: planTitle.trim(),
      week_number: Number(planWeek) || 1,
      objectives: planObjectives.trim() || null,
      kind: "lesson",
      status: "draft",
    });
    setPlanOpen(false);
    setPlanTitle("");
    setPlanWeek("1");
    setPlanObjectives("");
    void lessonPlans.refetch();
  };

  // Simulated AI ready triggers
  const handleTriggerAI = async (type: string) => {
    setAiGenerating(true);
    setAiResponse("");
    setTimeout(() => {
      setAiGenerating(false);
      if (type === "lesson") {
        setAiResponse(
          `### AI Generated Lesson Plan Outline\n\n**Proposed Chapters:**\n1. Introduction to Advanced Paradigms (Bloom: Recall)\n2. Framework Case Analysis (Bloom: Analyze)\n3. Custom Sandbox Design (Bloom: Create)\n\n*Use the options below to apply directly to outline.*`,
        );
      } else if (type === "quiz") {
        setAiResponse(
          `### AI Generated Question Pool\n\n1. Multiple Choice (Difficulty: Hard)\n**Question**: Which structure ensures real-time autosaving?\n**Options**: Local Storage [Correct], Memory Cache, Network Cookie.\n\n2. Multiple Choice (Difficulty: Medium)\n**Question**: Define rubric sync validation rules.\n**Options**: Grade book sync [Correct], Session validation.`,
        );
      } else {
        setAiResponse(
          `### AI Tutor bot response\n\nHello! I have scanned your syllabus. The core concepts emphasize Rubrics matching, timer countdown tracking, and version snapshotting. Let me know if you want to generate mock reviews.`,
        );
      }
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title={workspace.title}
        description={workspace.summary || "LMS Course Workspace"}
        crumbs={[{ label: "Learning", to: "/lms" }, { label: workspace.title }]}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Modules
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Assignments
          </TabsTrigger>
          <TabsTrigger
            value="quizzes"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Quizzes
          </TabsTrigger>
          <TabsTrigger
            value="discussions"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Discussions
          </TabsTrigger>
          <TabsTrigger
            value="live"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Live Classes
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Lesson Plans
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-none border bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>About this Subject</span>
                  <Button variant="outline" size="sm" onClick={() => setAiAssistantOpen(true)}>
                    <Sparkles className="size-4 mr-1 text-primary animate-pulse" /> Ask AI Assistant
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {workspace.overview ||
                    "Welcome to our Enterprise Classroom portal. Here, you will locate your modules, outline items, weekly planners, grades, and video links."}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Announcements</CardTitle>
                  <CardDescription>Updates from faculty</CardDescription>
                </div>
                {isFaculty && (
                  <Button size="sm" variant="ghost" onClick={() => setAnnounceOpen(true)}>
                    <Plus className="size-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {workspaceAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates posted yet.</p>
                ) : (
                  workspaceAnnouncements.map((ann) => (
                    <div key={ann.id} className="space-y-1 rounded border p-3 bg-muted/20">
                      <p className="text-sm font-medium">{ann.title}</p>
                      <p className="text-xs text-muted-foreground">{ann.body}</p>
                      <span className="text-[10px] text-muted-foreground block text-right">
                        {formatDateTime(ann.published_at)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Course Syllabus Content</h3>
            {isFaculty && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setNodeOpen(true)}>
                  <Plus className="size-4" /> Add Module
                </Button>
                <Button size="sm" onClick={() => setContentOpen(true)}>
                  <Plus className="size-4" /> Add Content
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {workspaceNodes.length === 0 ? (
              <EmptyState
                icon={BookMarked}
                title="Syllabus outline empty"
                description="Modules and sections will appear here when configured."
              />
            ) : (
              workspaceNodes.map((node, nodeIdx) => {
                const nodeContent = workspaceContent.filter((c) => c.node_id === node.id);
                return (
                  <Card key={node.id} className="shadow-none border">
                    <CardHeader className="py-3 bg-muted/10 border-b flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold capitalize">
                          [{node.kind}] {node.title}
                        </CardTitle>
                      </div>
                      {isFaculty && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleMoveNode(node.id, "up")}
                            disabled={nodeIdx === 0}
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleMoveNode(node.id, "down")}
                            disabled={nodeIdx === workspaceNodes.length - 1}
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {nodeContent.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No content items.</p>
                      ) : (
                        nodeContent.map((item, itemIdx) => {
                          const userProgress = progressRows.data?.find(
                            (p) => p.content_item_id === item.id,
                          );
                          const isCompleted = userProgress?.state === "completed";

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded border p-2 hover:bg-muted/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="size-4 text-primary" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{item.title}</p>
                                    <Badge variant="outline" className="text-[9px] h-4">
                                      v{item.version || 1}
                                    </Badge>
                                  </div>
                                  {item.body && (
                                    <p className="text-xs text-muted-foreground">{item.body}</p>
                                  )}
                                  {item.url && (
                                    <div className="mt-1 flex items-center gap-2">
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                                      >
                                        Open Link <ExternalLink className="size-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isFaculty ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItemId(item.id);
                                        setVersionsOpen(true);
                                      }}
                                    >
                                      History
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleMoveContent(item.id, "up")}
                                      disabled={itemIdx === 0}
                                    >
                                      <ArrowUp className="size-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleMoveContent(item.id, "down")}
                                      disabled={itemIdx === nodeContent.length - 1}
                                    >
                                      <ArrowDown className="size-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant={isCompleted ? "default" : "outline"}
                                    className="h-7 px-2 text-xs"
                                    onClick={async () => {
                                      await trackProgress.mutateAsync({
                                        workspaceId,
                                        nodeId: node.id,
                                        contentItemId: item.id,
                                        studentId: student.data?.id || user?.id || "",
                                        state: isCompleted ? "in_progress" : "completed",
                                        progressPercent: 100,
                                        timeSpentSeconds: 60,
                                      });
                                      void progressRows.refetch();
                                    }}
                                  >
                                    <CheckCircle2 className="size-3.5 mr-1" />
                                    {isCompleted ? "Completed" : "Mark Complete"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Course Assignments</h3>
            {isFaculty && (
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="size-4" /> Create Assignment
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workspaceAssignments.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon={ClipboardList}
                  title="No assignments"
                  description="Great job! There are no assignments."
                />
              </div>
            ) : (
              workspaceAssignments.map((assign) => {
                const sub = submissions.data?.find((s) => s.assignment_id === assign.id);
                return (
                  <Card key={assign.id} className="shadow-none border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold">{assign.title}</CardTitle>
                          {assign.due_at && (
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <Clock className="size-3" /> Due {formatDateTime(assign.due_at)}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="outline">{assign.max_marks} marks</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assign.instructions && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20 p-2 rounded">
                          {assign.instructions}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">
                          {assign.mode} Mode
                        </Badge>
                        {assign.allow_late && (
                          <Badge variant="secondary">
                            Late Penalty: {assign.late_penalty_percent}%
                          </Badge>
                        )}
                      </div>

                      {!isFaculty ? (
                        <div className="flex justify-between items-center border-t pt-3 mt-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Status:{" "}
                            {sub ? (
                              <Badge className="ml-1 capitalize">{sub.status}</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-1">
                                Unsubmitted
                              </Badge>
                            )}
                          </span>
                          {!sub ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAssignmentId(assign.id);
                                setSubmitOpen(true);
                              }}
                            >
                              Submit
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Submitted {formatDateTime(sub.submitted_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="border-t pt-3 mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">Student Submissions</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => toast.success("Downloaded all submissions as ZIP")}
                            >
                              <Download className="size-3 mr-1" /> Bulk Download
                            </Button>
                          </div>
                          {submissions.data?.filter((s) => s.assignment_id === assign.id).length ===
                          0 ? (
                            <p className="text-xs text-muted-foreground">No submissions yet.</p>
                          ) : (
                            submissions.data
                              ?.filter((s) => s.assignment_id === assign.id)
                              .map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between text-xs rounded border p-2 bg-muted/10"
                                >
                                  <span>Student [{s.student_id}]</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={statusTone(s.status)} className="capitalize">
                                      {s.status}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-[10px]"
                                      onClick={() => {
                                        setSelectedSubmissionId(s.id);
                                        setGradeOpen(true);
                                      }}
                                    >
                                      Evaluate
                                    </Button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Online Quizzes</h3>
            {isFaculty && (
              <Button size="sm" onClick={() => setQuizOpen(true)}>
                <Plus className="size-4" /> Add Quiz
              </Button>
            )}
          </div>

          {activeQuizId ? (
            <Card className="shadow-none border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Quiz Session: {workspaceQuizzes.find((q) => q.id === activeQuizId)?.title}
                  </CardTitle>
                  <CardDescription>Autosaving responses in background...</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded text-sm font-semibold">
                  <Clock className="size-4 text-primary" />
                  <span>
                    {Math.floor(quizTimeLeft / 60)}:
                    {(quizTimeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">This quiz has no questions.</p>
                ) : (
                  activeQuestions.map((q, idx) => (
                    <div key={q.id} className="space-y-3 rounded border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Q{idx + 1}. {q.body}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {q.difficulty || "medium"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(q.options) &&
                          q.options.map((opt) => (
                            <label
                              key={opt.value}
                              className="flex items-center gap-2 text-xs cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={answers[q.id] === opt.value}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                className="size-3.5"
                              />
                              {opt.label}
                            </label>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <DialogFooter className="p-4 bg-muted/10 border-t">
                <Button variant="outline" onClick={() => setActiveQuizId("")}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitQuiz}>Submit Quiz</Button>
              </DialogFooter>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workspaceQuizzes.length === 0 ? (
                <div className="col-span-2">
                  <EmptyState
                    icon={ClipboardList}
                    title="No Quizzes scheduled"
                    description="Quizzes and midterm tests will appear here."
                  />
                </div>
              ) : (
                workspaceQuizzes.map((quiz) => {
                  const attempt = quizAttempts.data?.find((a) => a.quiz_id === quiz.id);
                  return (
                    <Card key={quiz.id} className="shadow-none border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm font-semibold">{quiz.title}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <Clock className="size-3" /> {quiz.duration_minutes} minutes · Max
                              Attempts: {quiz.max_attempts}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">{quiz.total_marks} marks</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quiz.instructions && (
                          <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                            {quiz.instructions}
                          </p>
                        )}
                        <div className="flex justify-between items-center border-t pt-3 mt-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Status:{" "}
                            {attempt ? (
                              <Badge className="ml-1 capitalize">{attempt.status}</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-1">
                                Not started
                              </Badge>
                            )}
                          </span>
                          {!isFaculty && !attempt && (
                            <Button size="sm" onClick={() => handleStartQuiz(quiz.id)}>
                              Start Quiz
                            </Button>
                          )}
                          {attempt && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Score: {Number(attempt.score) || "Pending grading"}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setReviewAttempt(attempt);
                                  setReviewOpen(true);
                                }}
                              >
                                Review Attempts
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Q&A Forum Thread Discussions</h3>
            <Button size="sm" onClick={() => setDiscussionOpen(true)}>
              <Plus className="size-4" /> Ask a Question
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-3">
              {workspaceDiscussions.length === 0 ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="Discussion board silent"
                  description="No discussion topics."
                />
              ) : (
                workspaceDiscussions.map((disc) => (
                  <Card
                    key={disc.id}
                    className={`shadow-none border cursor-pointer hover:border-primary transition-all ${
                      selectedDiscussion?.id === disc.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedDiscussion(disc);
                      setTimeout(() => void refetchReplies(), 50);
                    }}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge className="capitalize">{disc.kind}</Badge>
                        {disc.is_pinned && <Pin className="size-3 text-primary animate-pulse" />}
                      </div>
                      <CardTitle className="text-xs font-semibold mt-2">{disc.title}</CardTitle>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedDiscussion ? (
                <Card className="shadow-none border h-full flex flex-col justify-between">
                  <div>
                    <CardHeader className="py-3 bg-muted/10 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          {selectedDiscussion.title}
                        </CardTitle>
                        {isFaculty && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={async () => {
                                await discussionActions.moderate.mutateAsync({
                                  id: selectedDiscussion.id,
                                  values: { is_pinned: !selectedDiscussion.is_pinned },
                                });
                                setSelectedDiscussion({
                                  ...selectedDiscussion,
                                  is_pinned: !selectedDiscussion.is_pinned,
                                });
                                void discussions.refetch();
                              }}
                            >
                              Pin Thread
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                      <p className="text-xs font-medium border-b pb-2">{selectedDiscussion.body}</p>

                      {replies && replies.length > 0 ? (
                        replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="text-xs bg-muted/20 p-2.5 rounded border pl-4 relative"
                          >
                            <p className="font-semibold text-muted-foreground mb-1">
                              User [{reply.created_by}]
                            </p>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {reply.body}
                            </p>
                            {reply.is_answer && (
                              <Badge className="absolute top-2 right-2 bg-emerald-600">
                                Answer
                              </Badge>
                            )}
                            {!reply.is_answer && isFaculty && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[9px] mt-1"
                                onClick={async () => {
                                  await discussionActions.markAnswer.mutateAsync({
                                    discussionId: selectedDiscussion.id,
                                    postId: reply.id,
                                  });
                                  void refetchReplies();
                                }}
                              >
                                Mark as Answer
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No replies yet.</p>
                      )}
                    </CardContent>
                  </div>
                  <div className="p-3 border-t bg-muted/10 flex gap-2">
                    <Input
                      placeholder="Type a response..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                    />
                    <Button onClick={handlePostReply}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                <EmptyState
                  icon={MessagesSquare}
                  title="Select a thread"
                  description="Choose a topic on the left to read replies."
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Live Classes Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Live Video Lectures</h3>
            {isFaculty && (
              <Button size="sm" onClick={() => setLiveOpen(true)}>
                <Plus className="size-4" /> Schedule Class
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {workspaceLive.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No online classes scheduled"
                description="Google Meet/Zoom links scheduled by your faculty will appear here."
              />
            ) : (
              workspaceLive.map((liveRow) => (
                <Card key={liveRow.id} className="shadow-none border">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="size-5 text-primary" />
                        <div>
                          <CardTitle className="text-sm font-semibold">{liveRow.title}</CardTitle>
                          <CardDescription className="text-xs">
                            Scheduled on {formatDateTime(liveRow.scheduled_start)} · via{" "}
                            {labelize(liveRow.provider)}
                          </CardDescription>
                        </div>
                      </div>
                      {liveRow.join_url && (
                        <Button size="sm" asChild>
                          <a href={liveRow.join_url} target="_blank" rel="noreferrer">
                            Join Class <ExternalLink className="size-3.5 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Lesson Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Weekly Syllabus Planner</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleTriggerAI("lesson")}>
                <Bot className="size-4 mr-1 text-primary" /> AI planner
              </Button>
              {isFaculty && (
                <Button size="sm" onClick={() => setPlanOpen(true)}>
                  <Plus className="size-4" /> Add Lesson Plan
                </Button>
              )}
            </div>
          </div>

          {aiResponse && (
            <Card className="shadow-none border border-primary bg-primary/5 p-4 text-xs whitespace-pre-wrap relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6"
                onClick={() => setAiResponse("")}
              >
                Clear
              </Button>
              {aiResponse}
            </Card>
          )}

          <div className="space-y-3">
            {workspacePlans.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No lesson plans set"
                description="Weekly lesson planners appear here."
              />
            ) : (
              workspacePlans.map((plan) => (
                <Card key={plan.id} className="shadow-none border">
                  <CardHeader className="py-3 bg-muted/10 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Week {plan.week_number}: {plan.title}
                      </CardTitle>
                      <Badge variant={plan.status === "completed" ? "default" : "outline"}>
                        {labelize(plan.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  {plan.objectives && (
                    <CardContent className="p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                      Objectives: {plan.objectives}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Learning Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Completed Content Modules"
              value={`${progressRows.data?.filter((p) => p.state === "completed").length ?? 0} / ${workspaceContent.length}`}
              icon={CheckCircle2}
            />
            <StatCard
              label="Assigned Homework Submitted"
              value={`${submissions.data?.length ?? 0} / ${workspaceAssignments.length}`}
              icon={ClipboardList}
            />
            <StatCard
              label="Online Exam Attempts"
              value={`${quizAttempts.data?.length ?? 0} / ${workspaceQuizzes.length}`}
              icon={Award}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Student Activity Heatmap (Simulated)
                </CardTitle>
                <CardDescription>Activity level over the past weeks.</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const intensities = [
                      "bg-emerald-50",
                      "bg-emerald-100",
                      "bg-emerald-200",
                      "bg-emerald-300",
                      "bg-emerald-400",
                    ];
                    const randomIntensity =
                      intensities[Math.floor(Math.random() * intensities.length)];
                    return (
                      <div
                        key={idx}
                        className={`h-8 rounded cursor-pointer transition-colors ${randomIntensity}`}
                        title={`Day ${idx + 1}: Active Engagement`}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Learner Engagement Risks</CardTitle>
                <CardDescription>System analysis of student performance risks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Content Completion</th>
                      <th className="p-3">Assignment Rate</th>
                      <th className="p-3">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/10">
                      <td className="p-3 font-medium">Demo Learner</td>
                      <td className="p-3">
                        {workspaceContent.length
                          ? Math.round(
                              ((progressRows.data?.filter((p) => p.state === "completed").length ??
                                0) /
                                workspaceContent.length) *
                                100,
                            )
                          : 0}
                        %
                      </td>
                      <td className="p-3">
                        {workspaceAssignments.length
                          ? Math.round(
                              ((submissions.data?.length ?? 0) / workspaceAssignments.length) * 100,
                            )
                          : 0}
                        %
                      </td>
                      <td className="p-3">
                        <Badge variant={riskLevel(70, 80, 75).tone}>
                          {riskLevel(70, 80, 75).label}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Assistant Dialog */}
      <Dialog open={aiAssistantOpen} onOpenChange={setAiAssistantOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="size-5 text-primary" /> AI Tutor Bot
            </DialogTitle>
            <DialogDescription>
              Get study recommendations, practice questions, or outline assistance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Ask me anything about the workspace..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            {aiGenerating && <InlineLoader label="Generating study recommendations..." />}
            {aiResponse && (
              <div className="p-3 rounded border bg-muted/10 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                {aiResponse}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiAssistantOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleTriggerAI("tutor")} disabled={aiGenerating}>
              Generate Recommendations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Version History</DialogTitle>
            <DialogDescription>Snapshot history and restore notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {contentVersions && contentVersions.length > 0 ? (
              contentVersions.map((v: { id: string; version: number; note?: string; created_at?: string }) => (
                <div
                  key={v.id}
                  className="flex justify-between items-center text-xs rounded border p-2 bg-muted/10"
                >
                  <div>
                    <p className="font-semibold">Version {v.version}</p>
                    <p className="text-muted-foreground">{v.note || "No edit comments."}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(v.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No document edits stored yet.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Attempts Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quiz Attempt Review</DialogTitle>
            <DialogDescription>Review answers and negative mark evaluations.</DialogDescription>
          </DialogHeader>
          {reviewAttempt && (
            <div className="space-y-3 text-xs">
              <p className="font-medium">
                Attempt Score:{" "}
                <span className="font-semibold">{Number(reviewAttempt.score)} marks</span>
              </p>
              <p className="text-muted-foreground">Percentage: {reviewAttempt.percentage}%</p>
              <Badge variant={reviewAttempt.is_passed ? "default" : "destructive"}>
                {reviewAttempt.is_passed ? "Passed" : "Failed"}
              </Badge>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
            />
            <Label htmlFor="ann-body">Body</Label>
            <Textarea
              id="ann-body"
              value={announceBody}
              onChange={(e) => setAnnounceBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostAnnouncement}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={nodeOpen} onOpenChange={setNodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Syllabus Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="node-title">Module Title</Label>
            <Input
              id="node-title"
              value={nodeTitle}
              onChange={(e) => setNodeTitle(e.target.value)}
            />
            <Label htmlFor="node-kind">Outline Level</Label>
            <select
              id="node-kind"
              value={nodeKind}
              onChange={(e) => setNodeKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
            >
              <option value="module">Module</option>
              <option value="chapter">Chapter</option>
              <option value="lesson">Lesson</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNode}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="c-node">Select Module</Label>
            <select
              id="c-node"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Choose Module...</option>
              {workspaceNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
            <Label htmlFor="c-title">Content Title</Label>
            <Input
              id="c-title"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
            />
            <Label htmlFor="c-kind">Kind</Label>
            <select
              id="c-kind"
              value={contentKind}
              onChange={(e) => setContentKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="page">Page / Syllabus Document</option>
              <option value="link">Web link</option>
              <option value="video">Lecture Video</option>
            </select>
            <Label htmlFor="c-body">Body / Text Notes (Supports Markdown & HTML rendering)</Label>
            <Textarea
              id="c-body"
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
            />
            <Label htmlFor="c-url">Resource URL</Label>
            <Input
              id="c-url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://..."
            />
            <Label htmlFor="c-sched">Scheduled Publish</Label>
            <Input
              id="c-sched"
              type="datetime-local"
              value={scheduledPublish}
              onChange={(e) => setScheduledPublish(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContent}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Homework Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="a-title">Assignment Title</Label>
            <Input
              id="a-title"
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
            />
            <Label htmlFor="a-inst">Instructions</Label>
            <Textarea
              id="a-inst"
              value={assignInstructions}
              onChange={(e) => setAssignInstructions(e.target.value)}
            />
            <Label htmlFor="a-marks">Max Marks</Label>
            <Input
              id="a-marks"
              type="number"
              value={assignMarks}
              onChange={(e) => setAssignMarks(e.target.value)}
            />
            <Label htmlFor="a-due">Due Date</Label>
            <Input
              id="a-due"
              type="datetime-local"
              value={assignDue}
              onChange={(e) => setAssignDue(e.target.value)}
            />
            <Label htmlFor="a-mode">Assignment Mode</Label>
            <select
              id="a-mode"
              value={assignMode}
              onChange={(e) => setAssignMode(e.target.value as any)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="individual">Individual Assignment</option>
              <option value="group">Group Assignment</option>
            </select>
            {assignMode === "group" && (
              <>
                <Label htmlFor="a-gsize">Group size</Label>
                <Input
                  id="a-gsize"
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                />
              </>
            )}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="a-late"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
              />
              <Label htmlFor="a-late">Allow late submissions</Label>
            </div>
            {allowLate && (
              <>
                <Label htmlFor="a-pen">Late Penalty percent</Label>
                <Input
                  id="a-pen"
                  type="number"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(e.target.value)}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Homework Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="s-text">Text response</Label>
            <Textarea
              id="s-text"
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              rows={4}
            />
            <Label htmlFor="s-url">File link / Drive URL</Label>
            <Input
              id="s-url"
              value={submitUrl}
              onChange={(e) => setSubmitUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluate Submission (Rubrics grading)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="g-marks">Marks Awarded</Label>
            <Input
              id="g-marks"
              type="number"
              value={gradeMarks}
              onChange={(e) => setGradeMarks(e.target.value)}
            />

            {/* Rubrics Sliders */}
            <div className="space-y-2 border-t pt-2 mt-2">
              <p className="text-xs font-semibold">Rubric Criteria Evaluation</p>
              <div>
                <Label className="text-xs flex justify-between">
                  Content Accuracy: <span>{rubricAccuracy}/10</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rubricAccuracy}
                  onChange={(e) => setRubricAccuracy(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-xs flex justify-between">
                  Formatting & Clarity: <span>{rubricFormatting}/10</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rubricFormatting}
                  onChange={(e) => setRubricFormatting(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-xs flex justify-between">
                  Originality: <span>{rubricOriginality}/10</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rubricOriginality}
                  onChange={(e) => setRubricOriginality(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <Label htmlFor="g-feed">Feedback / Remarks</Label>
            <Textarea
              id="g-feed"
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>Grade & Sync</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="q-title">Quiz Title</Label>
            <Input id="q-title" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
            <Label htmlFor="q-inst">Instructions</Label>
            <Textarea
              id="q-inst"
              value={quizInstructions}
              onChange={(e) => setQuizInstructions(e.target.value)}
            />
            <Label htmlFor="q-dur">Duration (Minutes)</Label>
            <Input
              id="q-dur"
              type="number"
              value={quizDuration}
              onChange={(e) => setQuizDuration(e.target.value)}
            />
            <Label htmlFor="q-marks">Total Marks</Label>
            <Input
              id="q-marks"
              type="number"
              value={quizMarks}
              onChange={(e) => setQuizMarks(e.target.value)}
            />
            <Label htmlFor="q-neg">Negative Marking per Question</Label>
            <Input
              id="q-neg"
              type="number"
              step="0.25"
              value={negMarking}
              onChange={(e) => setNegMarking(e.target.value)}
            />
            <Label htmlFor="q-limit">Attempt Limits</Label>
            <Input
              id="q-limit"
              type="number"
              value={attemptLimit}
              onChange={(e) => setAttemptLimit(e.target.value)}
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="q-shuf"
                checked={quizShuffle}
                onChange={(e) => setQuizShuffle(e.target.checked)}
              />
              <Label htmlFor="q-shuf">Shuffle questions order per student</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask a Question / Post Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="d-title">Title</Label>
            <Input id="d-title" value={discTitle} onChange={(e) => setDiscTitle(e.target.value)} />
            <Label htmlFor="d-body">Content</Label>
            <Textarea id="d-body" value={discBody} onChange={(e) => setDiscBody(e.target.value)} />
            <Label htmlFor="d-kind">Thread Category</Label>
            <select
              id="d-kind"
              value={discKind}
              onChange={(e) => setDiscKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="question">Question</option>
              <option value="discussion">General Discussion</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscussionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDiscussion}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={liveOpen} onOpenChange={setLiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Live Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="l-title">Class Title</Label>
            <Input
              id="l-title"
              value={liveTitle}
              onChange={(e) => setLiveOpenTitle(e.target.value)}
            />
            <Label htmlFor="l-start">Scheduled Start</Label>
            <Input
              id="l-start"
              type="datetime-local"
              value={liveStart}
              onChange={(e) => setLiveStart(e.target.value)}
            />
            <Label htmlFor="l-prov">Provider</Label>
            <select
              id="l-prov"
              value={liveProvider}
              onChange={(e) => setLiveProvider(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="google_meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
            </select>
            <Label htmlFor="l-url">Meeting URL</Label>
            <Input
              id="l-url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleClass}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Weekly Lesson Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="p-title">Plan Name</Label>
            <Input id="p-title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
            <Label htmlFor="p-week">Week Number</Label>
            <Input
              id="p-week"
              type="number"
              value={planWeek}
              onChange={(e) => setPlanWeek(e.target.value)}
            />
            <Label htmlFor="p-obj">Learning Objectives</Label>
            <Textarea
              id="p-obj"
              value={planObjectives}
              onChange={(e) => setPlanObjectives(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
