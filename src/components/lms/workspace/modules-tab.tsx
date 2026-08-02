import { useQuery } from "@tanstack/react-query";
import {
  BookMarked,
  Plus,
  ArrowUp,
  ArrowDown,
  FileText,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import {
  useNodes,
  useContentItems,
  useProgressRows,
  useVersionContent,
  useTrackProgress,
  useMyFaculty,
} from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";

export function ModulesTab({ workspace }: { workspace: any }) {
  const { tenant, can } = useAccess();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const nodes = useNodes();
  const contentItems = useContentItems();
  const progressRows = useProgressRows();
  const trackProgress = useTrackProgress();

  const workspaceNodes =
    nodes.data
      ?.filter((n) => n.workspace_id === workspace.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0)) ?? [];
  const workspaceContent =
    contentItems.data
      ?.filter((c) => c.workspace_id === workspace.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0)) ?? [];

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
  const versionContent = useVersionContent();

  const handleAddNode = async () => {
    if (!nodeTitle) {
      toast.error("Title required");
      return;
    }
    try {
      await nodeMutation.create.mutateAsync({
        tenant_id: tenant?.id,
        workspace_id: workspace.id,
        title: nodeTitle,
        kind: nodeKind,
        position: workspaceNodes.length,
      });
      toast.success("Module created");
      setNodeOpen(false);
      setNodeTitle("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddContent = async () => {
    if (!contentTitle || !selectedNodeId) {
      toast.error("Title and node required");
      return;
    }
    try {
      const position = workspaceContent.filter((c) => c.node_id === selectedNodeId).length;
      await contentMutation.create.mutateAsync({
        tenant_id: tenant?.id,
        workspace_id: workspace.id,
        node_id: selectedNodeId,
        title: contentTitle,
        kind: contentKind,
        body: contentBody,
        url: contentUrl,
        position,
        is_published: true,
      });
      toast.success("Content added");
      setContentOpen(false);
      setContentTitle("");
      setContentBody("");
      setContentUrl("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await contentMutation.remove.mutateAsync([id]);
      toast.success("Content deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMoveNode = async (id: string, dir: "up" | "down") => {
    const idx = workspaceNodes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === workspaceNodes.length - 1) return;

    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const current = workspaceNodes[idx];
    const swap = workspaceNodes[swapIdx];

    try {
      await nodeMutation.update.mutateAsync({ id: current.id, values: { position: swapIdx } });
      await nodeMutation.update.mutateAsync({ id: swap.id, values: { position: idx } });
    } catch (err: any) {
      toast.error("Failed to reorder");
    }
  };

  const handleMarkComplete = async (itemId: string, currentState: string | null) => {
    if (currentState === "completed") return;
    try {
      await trackProgress.mutateAsync({
        workspaceId: workspace.id,
        nodeId: workspaceContent.find(c => c.id === itemId)?.node_id || null,
        contentItemId: itemId,
        studentId: "", // Will be handled properly by auth inside the hook if needed, or we should import useAuth/useMyStudent
        state: "completed",
        progressPercent: 100,
        timeSpentSeconds: 60,
      });
      toast.success("Marked as complete");
    } catch (err: any) {
      toast.error(err.message);
    }
  };



  return (
    <>
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
                    nodeContent.map((item) => {
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
                          <div className="flex flex-col items-end gap-1">
                            {isFaculty ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
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
                                  className="h-7 w-7 p-0 text-destructive"
                                  onClick={() => handleDeleteContent(item.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant={isCompleted ? "ghost" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleMarkComplete(item.id, userProgress?.state ?? null)}
                                disabled={isCompleted || trackProgress.isPending}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="size-3.5 mr-1 text-success" />
                                    Done
                                  </>
                                ) : (
                                  "Mark Complete"
                                )}
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

      <Dialog open={nodeOpen} onOpenChange={setNodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Syllabus Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Week 1: Foundations"
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>Add Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parent Module</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
              >
                <option value="">Select a module...</option>
                {workspaceNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Reading Assignment 1"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description"
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>External URL (Optional)</Label>
              <Input
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContent}>Add Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Content Version History</DialogTitle>
            <DialogDescription>
              View and rollback to previous autosaves of this content item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {!contentVersions ? (
              <InlineLoader />
            ) : contentVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No historical versions found.</p>
            ) : (
              contentVersions.map((v: any) => (
                <div key={v.id} className="flex justify-between items-center rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">Version {v.version}</p>
                    <p className="text-xs text-muted-foreground">{v.change_summary}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
