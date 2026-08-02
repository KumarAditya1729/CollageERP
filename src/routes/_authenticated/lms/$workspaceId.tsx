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
import { AnalyticsTab } from "@/components/lms/workspace/analytics-tab";
import { AssignmentsTab } from "@/components/lms/workspace/assignments-tab";
import { DiscussionsTab } from "@/components/lms/workspace/discussions-tab";
import { LessonPlansTab } from "@/components/lms/workspace/lesson-plans-tab";
import { LiveClassesTab } from "@/components/lms/workspace/live-classes-tab";
import { ModulesTab } from "@/components/lms/workspace/modules-tab";
import { OverviewTab } from "@/components/lms/workspace/overview-tab";
import { QuizzesTab } from "@/components/lms/workspace/quizzes-tab";
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
  type DiscussionRow,
  type QuizAttemptRow,
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
          <OverviewTab workspace={workspace} setAiAssistantOpen={setAiAssistantOpen} />
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <ModulesTab workspace={workspace} />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsTab workspace={workspace} />
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <QuizzesTab workspace={workspace} />
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-4">
          <DiscussionsTab workspace={workspace} />
        </TabsContent>

        {/* Live Classes Tab */}
        <TabsContent value="live" className="space-y-4">
          <LiveClassesTab workspace={workspace} />
        </TabsContent>

        {/* Lesson Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <LessonPlansTab workspace={workspace} />
        </TabsContent>

        {/* Learning Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab workspace={workspace} />
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
              contentVersions.map(
                (v: { id: string; version: number; note?: string; created_at?: string }) => (
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
                ),
              )
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
    </>
  );
}
