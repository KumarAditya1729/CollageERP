import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { StatusPage } from "@/components/common/status-page";
import { InlineLoader } from "@/components/common/states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/settings/storage")({
  head: () => ({
    meta: [
      { title: "Storage — CampusOS" },
      {
        name: "description",
        content: "Storage usage across media assets and documents for your college.",
      },
      { property: "og:title", content: "Storage — CampusOS" },
      { property: "og:description", content: "Track CampusOS storage consumption by bucket." },
    ],
  }),
  component: StorageSettingsPage,
  errorComponent: ({ error }) => (
    <StatusPage code="500" title="Storage unavailable" description={error.message} />
  ),
});

const QUOTA_BYTES = 50 * 1024 * 1024 * 1024;

function StorageSettingsPage() {
  const { tenant } = useAccess();

  const usage = useQuery({
    queryKey: ["storage-usage", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const [media, documents] = await Promise.all([
        supabase
          .from("media_assets")
          .select("file_size")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null),
        supabase
          .from("documents")
          .select("file_size")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null),
      ]);
      if (media.error) throw media.error;
      if (documents.error) throw documents.error;
      const sum = (rows: { file_size: number | null }[]) =>
        rows.reduce((total, row) => total + Number(row.file_size ?? 0), 0);
      return {
        buckets: [
          {
            name: "media",
            label: "Media library",
            files: media.data?.length ?? 0,
            bytes: sum(media.data ?? []),
          },
          {
            name: "documents",
            label: "Document manager",
            files: documents.data?.length ?? 0,
            bytes: sum(documents.data ?? []),
          },
        ],
      };
    },
  });

  if (usage.isLoading) return <InlineLoader label="Calculating storage usage" />;

  const buckets = usage.data?.buckets ?? [];
  const total = buckets.reduce((sum, bucket) => sum + bucket.bytes, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Storage usage</CardTitle>
          <CardDescription>
            {formatBytes(total)} of {formatBytes(QUOTA_BYTES)} used across all private buckets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={Math.min(100, (total / QUOTA_BYTES) * 100)} />
          <div className="grid gap-4 sm:grid-cols-2">
            {buckets.map((bucket) => (
              <div key={bucket.name} className="rounded-lg border p-4">
                <p className="text-sm font-medium">{bucket.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {formatBytes(bucket.bytes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bucket.files} file{bucket.files === 1 ? "" : "s"} · private bucket “{bucket.name}
                  ”
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            All buckets are private. Files are served through short-lived signed URLs scoped to the
            college.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
