import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, MessagesSquare, Video, Plus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useLmsOverview, useWorkspaces, useLiveClasses } from "@/hooks/useLMS";
import { labelize, statusTone } from "@/lib/lms";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/lms/")({
  head: () => ({
    meta: [
      { title: "Learning management — CampusOS" },
      {
        name: "description",
        content:
          "Course workspaces, content, assignments, quizzes, discussions and live classes across the institution.",
      },
      { property: "og:title", content: "Learning management — CampusOS" },
      { property: "og:description", content: "The CampusOS learning management overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LmsDashboard,
  errorComponent: ({ error }) => (
    <ErrorState title="Learning unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface CourseResource extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
}

function LmsDashboard() {
  const { can } = useAccess();
  const { stats, loading } = useLmsOverview();
  const workspaces = useWorkspaces();
  const live = useLiveClasses();

  const [createOpen, setCreateOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [overview, setOverview] = useState("");

  const courses = useResourceList<CourseResource>({
    table: "courses",
    select: "id, code, title",
    orderBy: { column: "code" },
  });

  const { create } = useResourceMutations({ table: "lms_workspaces" });

  const upcoming = (live.data ?? [])
    .filter((row) => new Date(row.scheduled_start) >= new Date())
    .slice(0, 5);

  const handleCreate = async () => {
    if (!courseId) return;
    const selectedCourse = courses.data?.find((c) => c.id === courseId);
    await create.mutateAsync({
      course_id: courseId,
      title: title.trim() || selectedCourse?.title || "Course Workspace",
      summary: summary.trim() || null,
      overview: overview.trim() || null,
      status: "draft",
    });
    setCreateOpen(false);
    setCourseId("");
    setTitle("");
    setSummary("");
    setOverview("");
    void workspaces.refetch();
  };

  return (
    <>
      <PageHeader
        title="Learning management"
        description="Course workspaces, learning content, assignments, quizzes, discussions and live classes."
        crumbs={[{ label: "Learning" }]}
        actions={
          <div className="flex gap-2">
            {can("lms.create") && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create workspace
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/teaching">My teaching</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Course workspaces"
          value={stats.workspaces}
          icon={BookOpen}
          loading={loading}
          hint={`${stats.publishedWorkspaces} published · ${stats.contentItems} content items`}
        />
        <StatCard
          label="Assignments"
          value={stats.assignments}
          icon={ClipboardList}
          loading={loading}
          hint={`${stats.submissions} submissions · ${stats.pendingEvaluation} awaiting evaluation`}
        />
        <StatCard
          label="Quizzes"
          value={stats.quizzes}
          icon={ClipboardList}
          loading={loading}
          hint={`${stats.attempts} attempts · ${stats.quizAverage}% average`}
        />
        <StatCard
          label="Discussions"
          value={stats.discussions}
          icon={MessagesSquare}
          loading={loading}
          hint={`${stats.unresolved} unanswered questions`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Course workspaces</CardTitle>
            <CardDescription>Every learning space linked to a subject offering.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspaces.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading workspaces…</p>
            ) : (workspaces.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No course workspaces yet. Create one to publish content to learners.
              </p>
            ) : (
              (workspaces.data ?? []).map((workspace) => (
                <Link
                  key={workspace.id}
                  to="/lms/$workspaceId"
                  params={{ workspaceId: workspace.id }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{workspace.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {workspace.summary ?? "No summary yet"}
                    </p>
                  </div>
                  <Badge variant={statusTone(workspace.status)}>{labelize(workspace.status)}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Upcoming live classes</CardTitle>
            <CardDescription>Scheduled online sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live classes scheduled.</p>
            ) : (
              upcoming.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(row.scheduled_start)} · {labelize(row.provider)}
                    </p>
                  </div>
                  <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create course workspace</DialogTitle>
            <DialogDescription>
              Create a dedicated online learning environment for an academic subject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Subject Course</Label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a course...</option>
                {(courses.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Workspace Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave blank to use course title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Short Summary</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief subtitle or goal statement"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overview">Overview / Syllabus</Label>
              <Textarea
                id="overview"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="Syllabus details, teaching method, policies..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={create.isPending || !courseId}>
              {create.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
