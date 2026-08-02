import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, History, Loader2, Share2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { isImage, isPdf, signedUrlFor, type MediaAsset } from "@/hooks/useMedia";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, formatDateTime } from "@/lib/export";

export function MediaDetailsSheet({
  asset,
  open,
  onOpenChange,
  onRename,
  onToggleShare,
  favourite,
  onToggleFavourite,
}: {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (name: string, altText: string, caption: string) => Promise<void> | void;
  onToggleShare: (isPublic: boolean) => Promise<void> | void;
  favourite: boolean;
  onToggleFavourite: () => void;
}) {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setName(asset?.name ?? "");
    setAltText(asset?.alt_text ?? "");
    setCaption(asset?.caption ?? "");
    setPreview(null);
    if (!asset) return;
    let active = true;
    void signedUrlFor(asset)
      .then((url) => active && setPreview(url))
      .catch(() => active && setPreview(null));
    return () => {
      active = false;
    };
  }, [asset]);

  const tags = useQuery({
    queryKey: ["media-tags", asset?.id],
    enabled: Boolean(asset?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taggables")
        .select("id, tag_id, tags(name, color)")
        .eq("entity_type", "media_assets")
        .eq("entity_id", asset!.id);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        tag_id: string;
        tags: { name: string; color: string | null } | null;
      }[];
    },
  });

  const comments = useQuery({
    queryKey: ["media-comments", asset?.id],
    enabled: Boolean(asset?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, author_id")
        .eq("entity_type", "media_assets")
        .eq("entity_id", asset!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{ id: string; body: string; created_at: string; author_id: string | null }>;
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (authorIds.length > 0) {
        const { data: profData } = await supabase.from("profiles").select("id, full_name, email").in("id", authorIds);
        if (profData) {
          profData.forEach((p) => { profilesMap[p.id] = { full_name: p.full_name, email: p.email }; });
        }
      }
      return rows.map((r) => ({
        ...r,
        profiles: r.author_id && profilesMap[r.author_id] ? profilesMap[r.author_id] : { full_name: "Team Member", email: null },
      }));
    },
  });

  const versions = useQuery({
    queryKey: ["media-versions", asset?.id],
    enabled: Boolean(asset?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("record_versions")
        .select("id, version, created_at")
        .eq("entity_type", "media_assets")
        .eq("entity_id", asset!.id)
        .order("version", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addTag = useMutation({
    mutationFn: async (label: string) => {
      const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
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
          .insert({ tenant_id: tenant!.id, name: label.trim(), slug, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (createError) throw createError;
        tagId = created.id;
      }

      const { error } = await supabase.from("taggables").insert({
        tenant_id: tenant!.id,
        tag_id: tagId,
        entity_type: "media_assets",
        entity_id: asset!.id,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["media-tags", asset?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("comments").insert({
        tenant_id: tenant!.id,
        entity_type: "media_assets",
        entity_id: asset!.id,
        author_id: user!.id,
        body,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["media-comments", asset?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="truncate pr-6">{asset.name}</SheetTitle>
          <SheetDescription>
            {formatBytes(asset.file_size)} · {asset.mime_type ?? "unknown type"} ·
            {asset.width ? ` ${asset.width}×${asset.height}px · ` : " "}
            uploaded {formatDateTime(asset.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={favourite ? "default" : "outline"}
              size="sm"
              onClick={onToggleFavourite}
            >
              <Star className={favourite ? "size-4 fill-current" : "size-4"} />
              {favourite ? "Favourited" : "Favourite"}
            </Button>
            {preview ? (
              <Button variant="outline" size="sm" asChild>
                <a href={preview} target="_blank" rel="noopener noreferrer">
                  Open original
                </a>
              </Button>
            ) : null}
            {asset.is_public ? (
              <Badge variant="secondary" className="gap-1">
                <Share2 className="size-3" /> Shared
              </Badge>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border bg-muted/30">
            {!preview ? (
              <div className="flex h-56 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : isImage(asset) ? (
              <img
                src={preview}
                alt={asset.alt_text ?? asset.name}
                className="max-h-80 w-full object-contain"
              />
            ) : isPdf(asset) ? (
              <iframe src={preview} title={asset.name} className="h-96 w-full" />
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="size-6" />
                <span className="text-sm">Preview not available for this file type</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex-1">
                Tags
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex-1">
                Comments
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="media-name">File name</Label>
                <Input
                  id="media-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-alt">Alt text</Label>
                <Input
                  id="media-alt"
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Describe the image for screen readers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-caption">Caption</Label>
                <Textarea
                  id="media-caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </div>
              <Button onClick={() => void onRename(name, altText, caption)}>Save changes</Button>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Share with the college</p>
                  <p className="text-xs text-muted-foreground">
                    Shared files appear in the Shared view for everyone with media access.
                  </p>
                </div>
                <Switch
                  checked={asset.is_public}
                  onCheckedChange={(checked) => void onToggleShare(checked)}
                  aria-label="Share file"
                />
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-3 pt-4">
              <div className="flex flex-wrap gap-1.5">
                {(tags.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags on this file yet.</p>
                ) : (
                  (tags.data ?? []).map((row) => (
                    <Badge key={row.id} variant="secondary">
                      {row.tags?.name}
                    </Badge>
                  ))
                )}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const input = new FormData(event.currentTarget).get("tag");
                  const label = String(input ?? "").trim();
                  if (label) void addTag.mutateAsync(label);
                  event.currentTarget.reset();
                }}
              >
                <Input name="tag" placeholder="Add a tag…" aria-label="Add a tag" />
                <Button type="submit" variant="outline" disabled={addTag.isPending}>
                  Add
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="comments" className="space-y-3 pt-4">
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (comment.trim()) void addComment.mutateAsync(comment.trim());
                }}
              >
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Leave a note for your colleagues…"
                />
                <Button type="submit" size="sm" disabled={addComment.isPending || !comment.trim()}>
                  Post comment
                </Button>
              </form>
              <ul className="divide-y">
                {(comments.data ?? []).map((row) => (
                  <li key={row.id} className="py-3">
                    <p className="text-sm">{row.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.profiles?.full_name ?? row.profiles?.email ?? "Unknown"} ·{" "}
                      {formatDateTime(row.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
              {(comments.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : null}
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              {(versions.data ?? []).length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No previous versions"
                  description="Version snapshots are recorded when this file's metadata changes."
                />
              ) : (
                <ul className="divide-y">
                  {(versions.data ?? []).map((version) => (
                    <li key={version.id} className="flex items-center justify-between py-3 text-sm">
                      <span>Version {version.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(version.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
