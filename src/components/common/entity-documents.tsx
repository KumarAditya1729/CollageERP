import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Eye, FileText, History, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, formatDate, formatDateTime } from "@/lib/export";

export interface EntityDocument {
  id: string;
  title: string;
  status: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  issued_on: string | null;
  expires_on: string | null;
  current_version: number;
  created_at: string;
}

const statusTone: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  verified: "default",
  pending: "secondary",
  draft: "secondary",
  rejected: "destructive",
  expired: "destructive",
  archived: "outline",
};

function isExpired(row: EntityDocument) {
  return Boolean(row.expires_on && new Date(row.expires_on) < new Date());
}

/** Document manager scoped to a single record: upload, verify, expire, version. */
export function EntityDocuments({
  entityType,
  entityId,
  canManage = true,
  canVerify = false,
}: {
  entityType: string;
  entityId: string;
  canManage?: boolean;
  canVerify?: boolean;
}) {
  const { tenant, campus } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [historyFor, setHistoryFor] = useState<EntityDocument | null>(null);

  const queryKey = ["entity-documents", entityType, entityId];

  const documents = useQuery({
    queryKey,
    enabled: Boolean(entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, title, status, storage_bucket, storage_path, mime_type, file_size, issued_on, expires_on, current_version, created_at",
        )
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EntityDocument[];
    },
  });

  const versions = useQuery({
    queryKey: ["entity-document-versions", historyFor?.id],
    enabled: Boolean(historyFor?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, version, file_size, notes, created_at")
        .eq("document_id", historyFor!.id)
        .order("version", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file to upload");
      const path = `${tenant!.id}/${entityType}/${entityId}/${crypto.randomUUID()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (storageError) throw storageError;

      const { data: created, error } = await supabase
        .from("documents")
        .insert({
          tenant_id: tenant!.id,
          campus_id: campus?.id ?? null,
          entity_type: entityType,
          entity_id: entityId,
          title: title.trim() || file.name,
          storage_bucket: "documents",
          storage_path: path,
          mime_type: file.type || null,
          file_size: file.size,
          issued_on: issuedOn || null,
          expires_on: expiresOn || null,
          owner_id: user?.id ?? null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: versionError } = await supabase.from("document_versions").insert({
        tenant_id: tenant!.id,
        document_id: created.id,
        version: 1,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type || null,
        notes: "Initial upload",
        created_by: user?.id ?? null,
      });
      if (versionError) throw versionError;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setTitle("");
      setIssuedOn("");
      setExpiresOn("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "verified" | "rejected" | "pending";
    }) => {
      const { error } = await supabase
        .from("documents")
        .update({
          status,
          verified_by: status === "verified" ? (user?.id ?? null) : null,
          verified_at: status === "verified" ? new Date().toISOString() : null,
          updated_by: user?.id ?? null,
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document status updated");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openSigned = async (row: EntityDocument, download = false) => {
    const { data, error } = await supabase.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_path, 60, download ? { download: true } : undefined);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Files are stored privately and shared through short-lived signed links.
        </p>
        {canManage ? (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" />
            Upload
          </Button>
        ) : null}
      </div>

      {documents.isLoading ? <InlineLoader label="Loading documents" /> : null}
      {!documents.isLoading && (documents.data ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents attached"
          description="Upload certificates, mark sheets and identity proofs for verification."
        />
      ) : null}

      <ul className="space-y-2">
        {(documents.data ?? []).map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <Badge variant={statusTone[row.status] ?? "secondary"} className="capitalize">
                  {row.status}
                </Badge>
                {isExpired(row) ? <Badge variant="destructive">Expired</Badge> : null}
                <Badge variant="outline">v{row.current_version}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatBytes(row.file_size)} · uploaded {formatDateTime(row.created_at)}
                {row.expires_on ? ` · expires ${formatDate(row.expires_on)}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => void openSigned(row)}>
                <Eye className="size-4" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => void openSigned(row, true)}>
                <Download className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setHistoryFor(row)}>
                <History className="size-4" />
              </Button>
              {canVerify ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatus.mutate({ id: row.id, status: "verified" })}
                  >
                    <CheckCircle2 className="size-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatus.mutate({ id: row.id, status: "rejected" })}
                  >
                    <XCircle className="size-4 text-destructive" />
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>Attach a file to this record for verification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Class XII mark sheet"
                maxLength={160}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-issued">Issued on</Label>
                <Input
                  id="doc-issued"
                  type="date"
                  value={issuedOn}
                  onChange={(e) => setIssuedOn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-expires">Expires on</Label>
                <Input
                  id="doc-expires"
                  type="date"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => upload.mutate()} disabled={upload.isPending || !file}>
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyFor !== null} onOpenChange={(open) => !open && setHistoryFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>{historyFor?.title}</DialogDescription>
          </DialogHeader>
          {versions.isLoading ? <InlineLoader /> : null}
          {!versions.isLoading && (versions.data ?? []).length === 0 ? (
            <EmptyState icon={History} title="No versions recorded" className="py-8" />
          ) : null}
          <ul className="space-y-2">
            {(versions.data ?? []).map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span className="font-medium">Version {version.version}</span>
                <span className="text-muted-foreground">
                  {formatBytes(version.file_size)} · {formatDateTime(version.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
