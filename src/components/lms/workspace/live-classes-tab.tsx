import { Video, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useMyFaculty, useLiveClasses } from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { formatDateTime } from "@/lib/export";
import { labelize } from "@/lib/lms";
import { useAccess } from "@/hooks/useAccess";

export function LiveClassesTab({ workspace }: { workspace: any }) {
  const { can } = useAccess();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const liveClasses = useLiveClasses();
  const workspaceLive = liveClasses.data?.filter((l) => l.workspace_id === workspace.id) ?? [];
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveTitle, setLiveOpenTitle] = useState("");
  const [liveStart, setLiveStart] = useState("");
  const [liveProvider, setLiveProvider] = useState("google_meet");
  const [liveUrl, setLiveUrl] = useState("");
  const liveMutation = useResourceMutations({ table: "lms_live_classes" });

  const handleScheduleClass = async () => {
    if (!liveTitle.trim() || !liveStart) return;
    await liveMutation.create.mutateAsync({
      workspace_id: workspace.id,
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

  return (
    <>
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
    </>
  );
}
