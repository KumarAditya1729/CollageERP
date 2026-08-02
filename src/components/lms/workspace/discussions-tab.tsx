import { MessagesSquare, Plus, Pin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "@/hooks/useAuth";
import {
  useMyFaculty,
  useDiscussions,
  useDiscussionPosts,
  useDiscussionMutations,
  DiscussionRow,
} from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { useAccess } from "@/hooks/useAccess";

export function DiscussionsTab({ workspace }: { workspace: any }) {
  const { user } = useAuth();
  const { can } = useAccess();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const discussions = useDiscussions();
  const workspaceDiscussions =
    discussions.data?.filter((d) => d.workspace_id === workspace.id) ?? [];
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionRow | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discBody, setDiscBody] = useState("");
  const [discKind, setDiscKind] = useState("discussion");
  const discussionMutation = useResourceMutations({ table: "lms_discussions" });

  const { data: replies, refetch: refetchReplies } = useDiscussionPosts(selectedDiscussion?.id);
  const [replyBody, setReplyBody] = useState("");
  const discussionActions = useDiscussionMutations();

  const handleCreateDiscussion = async () => {
    if (!discTitle.trim() || !discBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    try {
      await discussionMutation.create.mutateAsync({
        workspace_id: workspace.id,
        title: discTitle.trim(),
        body: discBody.trim(),
        kind: discKind,
        author_id: user?.id || "",
      });
      toast.success("Discussion created");
      setDiscussionOpen(false);
      setDiscTitle("");
      setDiscBody("");
      void discussions.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create discussion");
    }
  };

  const handlePostReply = async () => {
    if (!replyBody.trim() || !selectedDiscussion) return;
    try {
      await discussionActions.reply.mutateAsync({
        discussion: selectedDiscussion as any,
        body: replyBody.trim(),
      });
      setReplyBody("");
      void refetchReplies();
      toast.success("Reply posted");
    } catch (err: any) {
      toast.error(err.message || "Failed to post reply");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Q&A Forum Thread Discussions</h3>
        <Button size="sm" onClick={() => setDiscussionOpen(true)}>
          <Plus className="size-4" /> Ask a Question
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
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
            <Card className="shadow-none border h-[600px] flex flex-col justify-between">
              <div className="flex flex-col h-full overflow-hidden">
                <CardHeader className="py-3 bg-muted/10 border-b shrink-0">
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
                          {selectedDiscussion.is_pinned ? "Unpin Thread" : "Pin Thread"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                  <p className="text-xs font-medium border-b pb-2">{selectedDiscussion.body}</p>

                  {replies && replies.length > 0 ? (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="flex items-start gap-3 bg-muted/20 p-3 rounded"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs whitespace-pre-wrap">{reply.body}</p>
                          {reply.is_answer && (
                            <Badge variant="secondary" className="mt-2 text-[10px]">
                              Instructor Endorsed
                            </Badge>
                          )}
                        </div>
                        {isFaculty && !reply.is_answer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={async () => {
                              await discussionActions.markAnswer.mutateAsync({
                                discussionId: selectedDiscussion.id,
                                postId: reply.id
                              });
                              void refetchReplies();
                            }}
                          >
                            Endorse
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No replies yet.</p>
                  )}
                </CardContent>
              </div>
              <div className="p-3 border-t bg-muted/10 flex items-center gap-2 shrink-0">
                <Input
                  placeholder="Type a reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostReply()}
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

      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Topic Title</Label>
            <Input value={discTitle} onChange={(e) => setDiscTitle(e.target.value)} />
            <Label>Category</Label>
            <select
              value={discKind}
              onChange={(e) => setDiscKind(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="discussion">General Discussion</option>
              <option value="question">Question</option>
              <option value="announcement">Announcement</option>
            </select>
            <Label>Details</Label>
            <Textarea
              className="h-32"
              value={discBody}
              onChange={(e) => setDiscBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscussionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDiscussion}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
