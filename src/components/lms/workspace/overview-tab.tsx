import { Sparkles, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMyFaculty, useAnnouncements } from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { formatDateTime } from "@/lib/export";

export function OverviewTab({ workspace, setAiAssistantOpen }: { workspace: any, setAiAssistantOpen: (v: boolean) => void }) {
  const { can, tenant } = useAccess();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const announcements = useAnnouncements();
  const workspaceAnnouncements =
    announcements.data?.filter((a) => a.workspace_id === workspace.id) ?? [];
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const announceMutation = useResourceMutations({ table: "lms_announcements" });

  const handlePostAnnouncement = async () => {
    if (!announceTitle || !announceBody) {
      toast.error("Title and body required");
      return;
    }
    try {
      await announceMutation.create.mutateAsync({
        tenant_id: tenant?.id,
        workspace_id: workspace.id,
        title: announceTitle,
        body: announceBody,
        is_published: true,
      });
      toast.success("Announcement posted!");
      setAnnounceOpen(false);
      setAnnounceTitle("");
      setAnnounceBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await announceMutation.remove.mutateAsync([id]);
      toast.success("Announcement removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    }
  };

  return (
    <>
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
                <div key={ann.id} className="group flex justify-between space-x-2 border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{ann.title}</p>
                    <p className="text-sm text-muted-foreground">{ann.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(ann.published_at as string)}
                    </p>
                  </div>
                  {isFaculty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
            <DialogDescription>
              This will be instantly visible to all students in this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Mid-term exam updates..."
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                placeholder="Please be advised that the date..."
                className="min-h-[100px]"
                value={announceBody}
                onChange={(e) => setAnnounceBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostAnnouncement}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
