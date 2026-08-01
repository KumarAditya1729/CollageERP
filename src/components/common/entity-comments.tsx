import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, StickyNote } from "lucide-react";
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
  profiles: { full_name: string | null; email: string | null } | null;
}

interface NoteRow {
  id: string;
  title: string | null;
  body: string;
  is_private: boolean;
  created_at: string;
}

/** Discussion panel — threaded comments plus private notes for any entity. */
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

  const commentsKey = ["entity-comments", entityType, entityId];
  const notesKey = ["entity-notes", entityType, entityId];

  const comments = useQuery({
    queryKey: commentsKey,
    enabled: Boolean(entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, is_internal, created_at, profiles:author_id(full_name, email)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
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
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-muted-foreground" />
          Comments
        </h3>

        {canManage ? (
          <div className="space-y-2 rounded-lg border p-3">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a comment for the record"
              maxLength={2000}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="internal-comment" checked={internal} onCheckedChange={setInternal} />
                <Label htmlFor="internal-comment" className="text-xs text-muted-foreground">
                  Internal only
                </Label>
              </div>
              <Button size="sm" onClick={() => addComment.mutate()} disabled={addComment.isPending}>
                Post comment
              </Button>
            </div>
          </div>
        ) : null}

        {comments.isLoading ? <InlineLoader label="Loading comments" /> : null}
        {!comments.isLoading && (comments.data ?? []).length === 0 ? (
          <EmptyState icon={MessageSquare} title="No comments yet" className="py-10" />
        ) : null}

        <ul className="space-y-3">
          {(comments.data ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {row.profiles?.full_name ?? row.profiles?.email ?? "Team member"}
                </p>
                <div className="flex items-center gap-2">
                  {row.is_internal ? <Badge variant="outline">Internal</Badge> : null}
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{row.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="size-4 text-muted-foreground" />
          Private notes
        </h3>

        {canManage ? (
          <div className="space-y-2 rounded-lg border p-3">
            <Input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Note title (optional)"
              maxLength={120}
            />
            <Textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Only staff with access to this record can read notes"
              maxLength={2000}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNote.mutate()}
                disabled={addNote.isPending}
              >
                Save note
              </Button>
            </div>
          </div>
        ) : null}

        {notes.isLoading ? <InlineLoader label="Loading notes" /> : null}
        {!notes.isLoading && (notes.data ?? []).length === 0 ? (
          <EmptyState icon={StickyNote} title="No notes yet" className="py-10" />
        ) : null}

        <ul className="space-y-3">
          {(notes.data ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{row.title ?? "Note"}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{row.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
