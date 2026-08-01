import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TaggableRow {
  id: string;
  tag_id: string;
  tags: { name: string; color: string | null } | null;
}

/** Reusable tagging strip for any entity backed by the tags/taggables tables. */
export function EntityTags({
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
  const [label, setLabel] = useState("");

  const queryKey = ["entity-tags", entityType, entityId];

  const tags = useQuery({
    queryKey,
    enabled: Boolean(entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taggables")
        .select("id, tag_id, tags(name, color)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      if (error) throw error;
      return (data ?? []) as unknown as TaggableRow[];
    },
  });

  const addTag = useMutation({
    mutationFn: async (raw: string) => {
      const name = raw.trim();
      if (!name) return;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data: existing, error: lookupError } = await supabase
        .from("tags")
        .select("id")
        .eq("tenant_id", tenant!.id)
        .eq("slug", slug)
        .is("deleted_at", null)
        .maybeSingle();
      if (lookupError) throw lookupError;

      let tagId = existing?.id;
      if (!tagId) {
        const { data: created, error: createError } = await supabase
          .from("tags")
          .insert({ tenant_id: tenant!.id, name, slug, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (createError) throw createError;
        tagId = created.id;
      }

      const { error } = await supabase.from("taggables").insert({
        tenant_id: tenant!.id,
        tag_id: tagId,
        entity_type: entityType,
        entity_id: entityId,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setLabel("");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("taggables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(tags.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : null}
        {(tags.data ?? []).map((row) => (
          <Badge key={row.id} variant="secondary" className="gap-1">
            {row.tags?.name ?? "Tag"}
            {canManage ? (
              <button
                type="button"
                aria-label={`Remove ${row.tags?.name ?? "tag"}`}
                onClick={() => removeTag.mutate(row.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </Badge>
        ))}
      </div>

      {canManage ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addTag.mutate(label);
          }}
        >
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add a tag"
            maxLength={40}
            className="h-8"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={!label.trim() || addTag.isPending}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      ) : null}
    </div>
  );
}
