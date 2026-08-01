import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, History, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents — CampusOS" },
      {
        name: "description",
        content: "Upload, verify, download and version-control official college documents.",
      },
      { property: "og:title", content: "Documents — CampusOS" },
      { property: "og:description", content: "The CampusOS document manager." },
    ],
  }),
  component: DocumentsPage,
});

interface DocumentRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string | null;
  status: string;
  entity_type: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  current_version: number;
  is_confidential: boolean;
  created_at: string;
}

function DocumentsPage() {
  const { tenant, can } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = can("document.manage");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [historyFor, setHistoryFor] = useState<DocumentRow | null>(null);

  const documents = useQuery({
    queryKey: ["documents", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, title, description, status, entity_type, storage_bucket, storage_path, mime_type, file_size, current_version, is_confidential, created_at",
        )
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  const versions = useQuery({
    queryKey: ["document-versions", historyFor?.id],
    enabled: Boolean(historyFor?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, version, storage_path, file_size, created_at, notes")
        .eq("document_id", historyFor!.id)
        .order("version", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file to upload");
      const path = `${tenant!.id}/documents/${crypto.randomUUID()}-${file.name}`;
      const { error: storageError } = await supabase.storage.from("documents").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (storageError) throw storageError;

      const { error } = await supabase.from("documents").insert({
        tenant_id: tenant!.id,
        title: title.trim() || file.name,
        description: description.trim() || null,
        entity_type: "general",
        storage_bucket: "documents",
        storage_path: path,
        mime_type: file.type || null,
        file_size: file.size,
        owner_id: user?.id ?? null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const download = async (row: DocumentRow) => {
    const { data, error } = await supabase.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <>
      <PageHeader
        title="Documents"
        description="Official records with verification status, confidentiality flags and full version history."
        crumbs={[{ label: "Content" }, { label: "Documents" }]}
        actions={
          canManage ? (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" />
              Upload document
            </Button>
          ) : null
        }
      />

      <DataTable<DocumentRow>
        columns={[
          { key: "title", header: "Document", alwaysVisible: true, className: "font-medium" },
          { key: "entity_type", header: "Category" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge
                variant={
                  row.status === "verified"
                    ? "default"
                    : row.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="capitalize"
              >
                {row.status}
              </Badge>
            ),
          },
          { key: "mime_type", header: "Type", defaultHidden: true },
          { key: "file_size", header: "Size", render: (row) => formatBytes(row.file_size) },
          { key: "current_version", header: "Version" },
          {
            key: "is_confidential",
            header: "Confidential",
            value: (row) => (row.is_confidential ? "Yes" : "No"),
          },
          {
            key: "created_at",
            header: "Uploaded",
            value: (row) => row.created_at,
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={documents.data}
        getRowId={(row) => row.id}
        loading={documents.isLoading}
        error={(documents.error as Error) ?? null}
        onRetry={() => void documents.refetch()}
        storageKey="documents"
        exportName="documents"
        searchPlaceholder="Search documents…"
        emptyTitle="No documents yet"
        emptyDescription="Upload certificates, approvals and official records to keep them versioned and auditable."
        emptyAction={
          canManage ? (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" />
              Upload document
            </Button>
          ) : undefined
        }
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Download"
              onClick={() => void download(row)}
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Version history"
              onClick={() => setHistoryFor(row)}
            >
              <History className="size-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              Files are stored privately and served through short-lived signed links.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="AICTE approval letter 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={upload.isPending}
            >
              Cancel
            </Button>
            <Button onClick={() => void upload.mutateAsync()} disabled={upload.isPending || !file}>
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
          {versions.isLoading ? (
            <InlineLoader label="Loading versions" />
          ) : (versions.data ?? []).length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Only the current version exists"
              description="Newer uploads of this document will be listed here."
            />
          ) : (
            <ul className="divide-y">
              {(versions.data ?? []).map((version) => (
                <li key={version.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">Version {version.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(version.created_at)} · {formatBytes(version.file_size)}
                    </p>
                  </div>
                  <Badge variant="outline">v{version.version}</Badge>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
