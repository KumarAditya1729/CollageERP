import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "media";

export interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string | null;
}

export interface MediaAsset {
  id: string;
  name: string;
  folder_id: string | null;
  alt_text: string | null;
  caption: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  is_public: boolean;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export function isImage(asset: Pick<MediaAsset, "mime_type">) {
  return Boolean(asset.mime_type?.startsWith("image/"));
}

export function isPdf(asset: Pick<MediaAsset, "mime_type">) {
  return asset.mime_type === "application/pdf";
}

/** Creates a short-lived signed URL for a privately stored media asset. */
export async function signedUrlFor(
  asset: Pick<MediaAsset, "storage_bucket" | "storage_path">,
  seconds = 300,
) {
  const { data, error } = await supabase.storage
    .from(asset.storage_bucket)
    .createSignedUrl(asset.storage_path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export function useMediaLibrary() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["media-assets", tenantId] });
    void queryClient.invalidateQueries({ queryKey: ["media-folders", tenantId] });
  };

  const folders = useQuery({
    queryKey: ["media-folders", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_folders")
        .select("id, name, parent_id, path")
        .eq("tenant_id", tenantId!)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []) as MediaFolder[];
    },
  });

  const assets = useQuery({
    queryKey: ["media-assets", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select(
          "id, name, folder_id, alt_text, caption, mime_type, file_size, width, height, is_public, storage_bucket, storage_path, created_at, updated_at",
        )
        .eq("tenant_id", tenantId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaAsset[];
    },
  });

  const createFolder = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string | null }) => {
      const parent = (folders.data ?? []).find((item) => item.id === parentId);
      const { error } = await supabase.from("media_folders").insert({
        tenant_id: tenantId!,
        name,
        parent_id: parentId,
        path: parent?.path ? `${parent.path}/${name}` : `/${name}`,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Folder created");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const upload = useMutation({
    mutationFn: async ({
      files,
      folderId,
      onProgress,
    }: {
      files: File[];
      folderId: string | null;
      onProgress?: (done: number, total: number) => void;
    }) => {
      let done = 0;
      for (const file of files) {
        const path = `${tenantId}/media/${crypto.randomUUID()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (storageError) throw storageError;

        const dimensions = await readImageSize(file);
        const { error } = await supabase.from("media_assets").insert({
          tenant_id: tenantId!,
          folder_id: folderId,
          name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
          storage_bucket: MEDIA_BUCKET,
          storage_path: path,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
        done += 1;
        onProgress?.(done, files.length);
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.files.length === 1 ? "File uploaded" : `${variables.files.length} files uploaded`,
      );
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<MediaAsset> }) => {
      const { error } = await supabase
        .from("media_assets")
        .update({ ...values, updated_by: user?.id ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const moveAssets = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      const { error } = await supabase
        .from("media_assets")
        .update({ folder_id: folderId, updated_by: user?.id ?? null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Files moved");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const copyAssets = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      const source = (assets.data ?? []).filter((asset) => ids.includes(asset.id));
      for (const asset of source) {
        const target = `${tenantId}/media/${crypto.randomUUID()}-${asset.name}`;
        const { error: copyError } = await supabase.storage
          .from(asset.storage_bucket)
          .copy(asset.storage_path, target);
        if (copyError) throw copyError;
        const { error } = await supabase.from("media_assets").insert({
          tenant_id: tenantId!,
          folder_id: folderId,
          name: `Copy of ${asset.name}`,
          alt_text: asset.alt_text,
          caption: asset.caption,
          mime_type: asset.mime_type,
          file_size: asset.file_size,
          width: asset.width,
          height: asset.height,
          storage_bucket: asset.storage_bucket,
          storage_path: target,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Files copied");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAssets = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("media_assets")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      toast.success(ids.length === 1 ? "File deleted" : `${ids.length} files deleted`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    folders: folders.data ?? [],
    assets: assets.data ?? [],
    isLoading: folders.isLoading || assets.isLoading,
    error: (folders.error ?? assets.error) as Error | null,
    refetch: () => {
      void folders.refetch();
      void assets.refetch();
    },
    createFolder,
    upload,
    updateAsset,
    moveAssets,
    copyAssets,
    deleteAssets,
  };
}

async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}
