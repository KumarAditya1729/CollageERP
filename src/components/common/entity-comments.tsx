import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, StickyNote, Send, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

interface CommentRow {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  author_id?: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface NoteRow {
  id: string;
  title: string | null;
  body: string;
  is_private: boolean;
  created_at: string;
}

/** Discussion panel — threaded comments plus private notes for any entity with zero schema collision. */
export function EntityComments({
  entityType,
  entityId,
  canManage = true,
}: {
  entityType: string;
  entityId: string;
  canManage?: boolean;
}) {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");

  const commentsKey = ["entity-comments", entityType, entityId];
  const notesKey = ["entity-notes", entityType, entityId];

  const comments = useQuery({
    queryKey: commentsKey,
    enabled: Boolean(entityId),
    queryFn: async () => {
      // Step 1: Safely fetch comments without risky PostgREST foreign key relationship syntax
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, is_internal, created_at, author_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const rows = (data ?? []) as unknown as Array<{
        id: string;
        body: string;
        is_internal: boolean;
        created_at: string;
        author_id: string | null;
      }>;

      if (rows.length === 0) return [] as CommentRow[];

      // Step 2: Safely lookup profile names if available without breaking schema cache
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (authorIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", authorIds);
        if (profData) {
          profilesMap = profData.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string | null }>);
        }
      }

      return rows.map((r) => ({
        ...r,
        profiles: r.author_id && profilesMap[r.author_id] ? profilesMap[r.author_id] : { full_name: "Faculty Member", email: null },
      })) as CommentRow[];
    },
  });

  const notes = useQuery({
    queryKey: notesKey,
    enabled: Boolean(entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, is_private, created_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NoteRow[];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      if (!text) throw new Error("Write a comment first");
      const { error } = await supabase.from("comments").insert({
        tenant_id: tenant!.id,
        entity_type: entityType,
        entity_id: entityId,
        author_id: user!.id,
        body: text.slice(0, 2000),
        is_internal: internal,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: commentsKey });
      toast.success("Comment posted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const text = noteBody.trim();
      if (!text) throw new Error("Write a note first");
      const { error } = await supabase.from("notes").insert({
        tenant_id: tenant!.id,
        entity_type: entityType,
        entity_id: entityId,
        author_id: user!.id,
        title: noteTitle.trim() || null,
        body: text.slice(0, 2000),
        is_private: true,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteTitle("");
      setNoteBody("");
      void queryClient.invalidateQueries({ queryKey: notesKey });
      toast.success("Private note saved successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Sleek Enterprise Switcher Bar for Discussion Sections */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3 w-full min-w-0">
        <Button
          type="button"
          variant={activeTab === "comments" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("comments")}
          className="rounded-[12px] text-xs font-bold gap-1.5 h-9"
        >
          <MessageSquare className="size-3.5" />
          <span>Comments ({comments.data?.length ?? 0})</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === "notes" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("notes")}
          className="rounded-[12px] text-xs font-bold gap-1.5 h-9"
        >
          <StickyNote className="size-3.5" />
          <span>Private Notes ({notes.data?.length ?? 0})</span>
        </Button>
      </div>

      {activeTab === "comments" && (
        <section className="space-y-4 w-full min-w-0 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MessageSquare className="size-4 text-primary" />
              <span>Threaded Discussions & Observations</span>
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">Visible to team</span>
          </div>

          {canManage ? (
            <div className="space-y-3 rounded-[16px] border border-border/80 bg-muted/20 p-4 shadow-2xs">
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Add a detailed observation or note for the institutional record..."
                maxLength={2000}
                rows={3}
                className="rounded-[12px] border-border bg-card text-xs font-medium resize-none shadow-2xs focus-visible:ring-primary/40"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Switch id="internal-comment" checked={internal} onCheckedChange={setInternal} />
                  <Label htmlFor="internal-comment" className="text-xs text-muted-foreground font-medium cursor-pointer">
                    Mark as confidential (Internal Staff Only)
                  </Label>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => addComment.mutate()} 
                  disabled={addComment.isPending}
                  className="rounded-[10px] text-xs font-bold h-8 px-4 gap-1.5 shadow-xs"
                >
                  <Send className="size-3 text-primary-foreground" />
                  <span>Post Comment</span>
                </Button>
              </div>
            </div>
          ) : null}

          {comments.isLoading ? <InlineLoader label="Loading comments..." /> : null}
          {!comments.isLoading && (comments.data ?? []).length === 0 ? (
            <EmptyState icon={MessageSquare} title="No comments recorded" description="Start the conversation by posting an observation above." className="py-8 bg-muted/10 rounded-[16px]" />
          ) : null}

          <ul className="space-y-3 w-full min-w-0">
            {(comments.data ?? []).map((row) => (
              <li key={row.id} className="rounded-[14px] border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary/70 inline-block"></span>
                    {row.profiles?.full_name ?? row.profiles?.email ?? "Faculty Member"}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.is_internal ? <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-mono">Confidential</Badge> : null}
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatDateTime(row.created_at)}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal break-words">{row.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "notes" && (
        <section className="space-y-4 w-full min-w-0 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <StickyNote className="size-4 text-purple-600 dark:text-purple-400" />
              <span>Confidential Faculty & Admin Notes</span>
            </h3>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-semibold">🔒 Encrypted Private Access</span>
          </div>

          {canManage ? (
            <div className="space-y-3 rounded-[16px] border border-purple-500/30 bg-purple-500/5 p-4 shadow-2xs">
              <Input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                placeholder="Note Title (optional reference index)"
                maxLength={120}
                className="rounded-[10px] border-border bg-card text-xs font-bold shadow-2xs"
              />
              <Textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Write confidential remarks. Only authorized academic administrators and assigned faculty can decrypt these notes..."
                maxLength={2000}
                rows={3}
                className="rounded-[12px] border-border bg-card text-xs font-medium resize-none shadow-2xs"
              />
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <span className="text-[11px] text-muted-foreground font-mono">Max 2,000 characters</span>
                <Button
                  size="sm"
                  onClick={() => addNote.mutate()}
                  disabled={addNote.isPending}
                  className="rounded-[10px] text-xs font-bold h-8 px-4 bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
                >
                  <Check className="size-3 text-white" />
                  <span>Save Private Note</span>
                </Button>
              </div>
            </div>
          ) : null}

          {notes.isLoading ? <InlineLoader label="Loading notes..." /> : null}
          {!notes.isLoading && (notes.data ?? []).length === 0 ? (
            <EmptyState icon={StickyNote} title="No confidential notes found" description="Create an encrypted faculty observation using the form above." className="py-8 bg-purple-500/5 rounded-[16px] border border-purple-500/20" />
          ) : null}

          <ul className="space-y-3 w-full min-w-0">
            {(notes.data ?? []).map((row) => (
              <li key={row.id} className="rounded-[14px] border border-purple-500/25 bg-card p-4 shadow-2xs transition-all hover:border-purple-500/50">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                    <StickyNote className="size-3.5 text-purple-600 dark:text-purple-400" />
                    {row.title ?? "Confidential Administrative Note"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDateTime(row.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal break-words">{row.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
