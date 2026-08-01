import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { StatusPage } from "@/components/common/status-page";
import { EmptyState, ErrorState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/features")({
  head: () => ({
    meta: [
      { title: "Feature flags — CampusOS" },
      {
        name: "description",
        content: "Turn CampusOS modules on or off for your college with feature flags.",
      },
      { property: "og:title", content: "Feature flags — CampusOS" },
      { property: "og:description", content: "Control which CampusOS modules are active." },
    ],
  }),
  component: FeatureFlagsPage,
  errorComponent: ({ error }) => (
    <StatusPage code="500" title="Feature flags unavailable" description={error.message} />
  ),
});

function FeatureFlagsPage() {
  const { tenant } = useAccess();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["feature-flags", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const [features, overrides] = await Promise.all([
        supabase
          .from("features")
          .select("id, key, name, module, description, is_beta, default_enabled")
          .order("module"),
        supabase
          .from("tenant_features")
          .select("id, feature_id, enabled")
          .eq("tenant_id", tenant!.id),
      ]);
      if (features.error) throw features.error;
      if (overrides.error) throw overrides.error;
      const overrideMap = new Map(
        (overrides.data ?? []).map((row) => [row.feature_id, row.enabled]),
      );
      return (features.data ?? []).map((feature) => ({
        ...feature,
        enabled: overrideMap.get(feature.id) ?? feature.default_enabled,
      }));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("tenant_features")
        .upsert(
          { tenant_id: tenant!.id, feature_id: featureId, enabled },
          { onConflict: "tenant_id,feature_id,campus_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature updated");
      void queryClient.invalidateQueries({ queryKey: ["feature-flags", tenant?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grouped = new Map<string, NonNullable<typeof query.data>>();
  for (const feature of query.data ?? []) {
    const list = grouped.get(feature.module) ?? [];
    list.push(feature);
    grouped.set(feature.module, list);
  }

  if (query.isLoading) return <InlineLoader label="Loading feature flags" />;
  if (query.error)
    return (
      <ErrorState
        description={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    );
  if ((query.data ?? []).length === 0) {
    return (
      <EmptyState title="No features registered" description="The feature catalogue is empty." />
    );
  }

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([module, features]) => (
        <Card key={module}>
          <CardHeader>
            <CardTitle className="capitalize">{module}</CardTitle>
            <CardDescription>Modules in this area of CampusOS.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {features.map((feature) => (
                <li key={feature.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{feature.name}</p>
                      {feature.is_beta ? <Badge variant="secondary">Beta</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feature.description ?? feature.key}
                    </p>
                  </div>
                  <Switch
                    checked={feature.enabled}
                    aria-label={`Enable ${feature.name}`}
                    onCheckedChange={(checked) =>
                      void toggle.mutateAsync({ featureId: feature.id, enabled: checked })
                    }
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
