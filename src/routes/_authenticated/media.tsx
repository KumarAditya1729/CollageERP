import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Copy,
  Download,
  FileText,
  FolderPlus,
  Folder as FolderIcon,
  Grid2x2,
  Image as ImageIcon,
  List,
  MoveRight,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { MediaDetailsSheet } from "@/components/media/media-details-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/hooks/useAccess";
import { PREF_KEYS, useLocalList } from "@/hooks/useLocalList";
import {
  isImage,
  signedUrlFor,
  useMediaLibrary,
  type MediaAsset,
  type MediaFolder,
} from "@/hooks/useMedia";
import { formatBytes, formatDateTime } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media library — CampusOS" },
      {
        name: "description",
        content:
          "Organise, preview and share college images, PDFs and documents from one asset library.",
      },
      { property: "og:title", content: "Media library — CampusOS" },
      { property: "og:description", content: "Digital asset management for your college." },
    ],
  }),
  component: MediaPage,
});

type View = "grid" | "list";
type Scope = "all" | "recent" | "shared" | "favourites";
type SortKey = "recent" | "name" | "size";

function MediaPage() {
  const { can } = useAccess();
  const canManage = can("media.manage");
  const library = useMediaLibrary();
  const favourites = useLocalList(PREF_KEYS.favouriteMedia, 200);

  const [folderId, setFolderId] = useState<string | null>(null);
  const [view, setView] = useState<View>("grid");
  const [scope, setScope] = useState<Scope>("all");
  const [term, setTerm] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<MediaAsset | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [folderDialog, setFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [moveDialog, setMoveDialog] = useState<null | "move" | "copy">(null);
  const [moveTarget, setMoveTarget] = useState<string>("root");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const breadcrumb = useMemo(() => {
    const trail: MediaFolder[] = [];
    let current = library.folders.find((item) => item.id === folderId) ?? null;
    while (current) {
      trail.unshift(current);
      current = library.folders.find((item) => item.id === current!.parent_id) ?? null;
    }
    return trail;
  }, [folderId, library.folders]);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let rows = library.assets.filter((asset) => {
      if (scope === "all" && asset.folder_id !== folderId) return false;
      if (scope === "shared" && !asset.is_public) return false;
      if (scope === "favourites" && !favourites.has(asset.id)) return false;
      if (scope === "recent" && new Date(asset.created_at).getTime() < weekAgo) return false;
      if (type === "images" && !isImage(asset)) return false;
      if (type === "documents" && isImage(asset)) return false;
      if (needle && !`${asset.name} ${asset.caption ?? ""}`.toLowerCase().includes(needle))
        return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return (b.file_size ?? 0) - (a.file_size ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return rows;
  }, [library.assets, scope, folderId, type, term, sort, favourites]);

  const childFolders = library.folders.filter((item) => item.parent_id === folderId);
  const totalBytes = library.assets.reduce((sum, asset) => sum + (asset.file_size ?? 0), 0);

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setProgress({ done: 0, total: files.length });
    try {
      await library.upload.mutateAsync({
        files,
        folderId,
        onProgress: (done, total) => setProgress({ done, total }),
      });
    } finally {
      setProgress(null);
    }
  };

  const bulkDownload = async (ids: string[]) => {
    const rows = library.assets.filter((asset) => ids.includes(asset.id));
    for (const asset of rows) {
      try {
        const url = await signedUrlFor(asset);
        window.open(url, "_blank", "noopener");
      } catch (error) {
        toast.error((error as Error).message);
      }
    }
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );

  return (
    <>
      <PageHeader
        title="Media library"
        description="Every image, PDF and asset used across CampusOS, stored privately and served through signed links."
        crumbs={[{ label: "Content" }, { label: "Media library" }]}
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setFolderDialog(true)}>
                <FolderPlus className="size-4" />
                New folder
              </Button>
              <Button onClick={() => fileInput.current?.click()}>
                <Upload className="size-4" />
                Upload
              </Button>
            </>
          ) : null
        }
      />

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Files"
          value={library.assets.length}
          icon={ImageIcon}
          loading={library.isLoading}
        />
        <StatCard
          label="Folders"
          value={library.folders.length}
          icon={FolderIcon}
          loading={library.isLoading}
        />
        <StatCard
          label="Storage used"
          value={formatBytes(totalBytes)}
          icon={FileText}
          loading={library.isLoading}
          hint="Across the private media bucket"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="space-y-1 p-3">
            <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Folders
            </p>
            <FolderNode
              folders={library.folders}
              parentId={null}
              depth={0}
              activeId={folderId}
              onSelect={(id) => {
                setFolderId(id);
                setScope("all");
                setSelected([]);
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={scope} onValueChange={(value) => setScope(value as Scope)}>
              <TabsList>
                <TabsTrigger value="all">Browse</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
                <TabsTrigger value="favourites">Favourites</TabsTrigger>
              </TabsList>
            </Tabs>

            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search files…"
              className="w-full sm:w-56"
              aria-label="Search files"
            />

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="w-[150px]" aria-label="Sort files">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="size">Largest first</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                aria-label="Grid view"
                onClick={() => setView("grid")}
              >
                <Grid2x2 className="size-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                aria-label="List view"
                onClick={() => setView("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>

          {scope === "all" ? (
            <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => setFolderId(null)}
              >
                All files
              </button>
              {breadcrumb.map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5" />
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setFolderId(crumb.id)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          ) : null}

          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <Separator orientation="vertical" className="h-5" />
              <Button size="sm" variant="outline" onClick={() => void bulkDownload(selected)}>
                <Download className="size-4" />
                Download
              </Button>
              {canManage ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setMoveDialog("move")}>
                    <MoveRight className="size-4" />
                    Move
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMoveDialog("copy")}>
                    <Copy className="size-4" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </>
              ) : null}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          ) : null}

          {progress ? (
            <div className="space-y-1.5 rounded-lg border p-3">
              <p className="text-sm">
                Uploading {progress.done} of {progress.total} files…
              </p>
              <Progress value={(progress.done / progress.total) * 100} />
            </div>
          ) : null}

          <div
            onDragOver={(event) => {
              if (!canManage) return;
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              if (!canManage) return;
              event.preventDefault();
              setDragging(false);
              void uploadFiles(Array.from(event.dataTransfer.files));
            }}
            className={cn(
              "rounded-xl border border-dashed transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-transparent",
            )}
          >
            {library.error ? (
              <ErrorState description={library.error.message} onRetry={library.refetch} />
            ) : library.isLoading ? (
              <CardsSkeleton count={8} />
            ) : visible.length === 0 && childFolders.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title={scope === "all" ? "This folder is empty" : "Nothing here yet"}
                description={
                  canManage
                    ? "Drag files anywhere on this panel, or use the upload button to add assets."
                    : "Files uploaded by your colleagues will appear here."
                }
                action={
                  canManage ? (
                    <Button onClick={() => fileInput.current?.click()}>
                      <Upload className="size-4" />
                      Upload files
                    </Button>
                  ) : undefined
                }
              />
            ) : view === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {scope === "all"
                  ? childFolders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setFolderId(folder.id)}
                        className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent"
                      >
                        <FolderIcon className="size-5 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">{folder.name}</span>
                      </button>
                    ))
                  : null}
                {visible.map((asset) => (
                  <MediaCard
                    key={asset.id}
                    asset={asset}
                    selected={selected.includes(asset.id)}
                    favourite={favourites.has(asset.id)}
                    onToggleSelect={() => toggleSelected(asset.id)}
                    onOpen={() => setActive(asset)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b text-left">
                      <th className="w-10 p-3" />
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Size</th>
                      <th className="p-3 font-medium">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((asset) => (
                      <tr key={asset.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="p-3">
                          <Checkbox
                            checked={selected.includes(asset.id)}
                            onCheckedChange={() => toggleSelected(asset.id)}
                            aria-label={`Select ${asset.name}`}
                          />
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left font-medium hover:underline"
                            onClick={() => setActive(asset)}
                          >
                            {isImage(asset) ? (
                              <ImageIcon className="size-4 text-muted-foreground" />
                            ) : (
                              <FileText className="size-4 text-muted-foreground" />
                            )}
                            <span className="truncate">{asset.name}</span>
                            {favourites.has(asset.id) ? (
                              <Star className="size-3.5 fill-current text-primary" />
                            ) : null}
                          </button>
                        </td>
                        <td className="p-3 text-muted-foreground">{asset.mime_type ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">
                          {formatBytes(asset.file_size)}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDateTime(asset.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaDetailsSheet
        asset={active}
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        favourite={active ? favourites.has(active.id) : false}
        onToggleFavourite={() => active && favourites.toggle(active.id)}
        onRename={async (name, altText, caption) => {
          if (!active) return;
          await library.updateAsset.mutateAsync({
            id: active.id,
            values: { name, alt_text: altText || null, caption: caption || null },
          });
          setActive({ ...active, name, alt_text: altText || null, caption: caption || null });
          toast.success("File updated");
        }}
        onToggleShare={async (isPublic) => {
          if (!active) return;
          await library.updateAsset.mutateAsync({ id: active.id, values: { is_public: isPublic } });
          setActive({ ...active, is_public: isPublic });
        }}
      />

      <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Created inside {breadcrumb.at(-1)?.name ?? "All files"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Convocation 2026"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!folderName.trim() || library.createFolder.isPending}
              onClick={async () => {
                await library.createFolder.mutateAsync({
                  name: folderName.trim(),
                  parentId: folderId,
                });
                setFolderName("");
                setFolderDialog(false);
              }}
            >
              Create folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveDialog !== null} onOpenChange={(open) => !open && setMoveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{moveDialog === "copy" ? "Copy files" : "Move files"}</DialogTitle>
            <DialogDescription>
              {selected.length} file{selected.length === 1 ? "" : "s"} will be{" "}
              {moveDialog === "copy" ? "copied" : "moved"} to the folder you choose.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="move-target">Destination folder</Label>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger id="move-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">All files (no folder)</SelectItem>
                {library.folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.path ?? folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={library.moveAssets.isPending || library.copyAssets.isPending}
              onClick={async () => {
                const target = moveTarget === "root" ? null : moveTarget;
                if (moveDialog === "copy") {
                  await library.copyAssets.mutateAsync({ ids: selected, folderId: target });
                } else {
                  await library.moveAssets.mutateAsync({ ids: selected, folderId: target });
                }
                setSelected([]);
                setMoveDialog(null);
              }}
            >
              {moveDialog === "copy" ? "Copy files" : "Move files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${selected.length} file${selected.length === 1 ? "" : "s"}?`}
        description="Deleted files are removed from the library and can be restored by an administrator from the audit trail."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await library.deleteAssets.mutateAsync(selected);
          setSelected([]);
        }}
      />
    </>
  );
}

function FolderNode({
  folders,
  parentId,
  depth,
  activeId,
  onSelect,
}: {
  folders: MediaFolder[];
  parentId: string | null;
  depth: number;
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const children = folders.filter((folder) => folder.parent_id === parentId);

  return (
    <>
      {depth === 0 ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
            activeId === null && "bg-accent font-medium",
          )}
        >
          <FolderIcon className="size-4 text-muted-foreground" />
          All files
        </button>
      ) : null}
      {children.map((folder) => (
        <div key={folder.id}>
          <button
            type="button"
            onClick={() => onSelect(folder.id)}
            style={{ paddingLeft: 8 + depth * 12 + 8 }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors hover:bg-accent",
              activeId === folder.id && "bg-accent font-medium",
            )}
          >
            <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{folder.name}</span>
          </button>
          <FolderNode
            folders={folders}
            parentId={folder.id}
            depth={depth + 1}
            activeId={activeId}
            onSelect={onSelect}
          />
        </div>
      ))}
    </>
  );
}

function MediaCard({
  asset,
  selected,
  favourite,
  onToggleSelect,
  onOpen,
}: {
  asset: MediaAsset;
  selected: boolean;
  favourite: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-colors hover:bg-accent/40",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="absolute left-2 top-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${asset.name}`}
        />
      </div>
      {favourite ? (
        <Star
          className="absolute right-2 top-2 z-10 size-4 fill-current text-primary"
          aria-hidden
        />
      ) : null}
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex h-32 items-center justify-center bg-muted/40">
          {isImage(asset) ? (
            <ImageIcon className="size-7 text-muted-foreground" aria-hidden />
          ) : (
            <FileText className="size-7 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="truncate text-sm font-medium">{asset.name}</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {formatBytes(asset.file_size)}
            {asset.is_public ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Shared
              </Badge>
            ) : null}
          </p>
        </div>
      </button>
    </div>
  );
}
