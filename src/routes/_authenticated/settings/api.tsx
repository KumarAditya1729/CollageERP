import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { StatusPage } from "@/components/common/status-page";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/settings/api")({
  head: () => ({
    meta: [
      { title: "API & webhooks — CampusOS" },
      {
        name: "description",
        content: "API clients, webhook endpoints and recent delivery attempts for your college.",
      },
      { property: "og:title", content: "API & webhooks — CampusOS" },
      { property: "og:description", content: "Manage CampusOS API access and outbound webhooks." },
    ],
  }),
  component: ApiSettingsPage,
  errorComponent: ({ error }) => (
    <StatusPage code="500" title="API settings unavailable" description={error.message} />
  ),
});

function ApiSettingsPage() {
  const { tenant } = useAccess();

  const clients = useQuery({
    queryKey: ["api-clients", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_clients")
        .select(
          "id, name, description, key_prefix, scopes, rate_limit_per_minute, is_active, last_used_at",
        )
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const endpoints = useQuery({
    queryKey: ["webhook-endpoints", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, name, url, events, is_active, max_retries")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deliveries = useQuery({
    queryKey: ["webhook-deliveries", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("id, status, attempts, response_status, delivered_at, created_at")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API clients</CardTitle>
          <CardDescription>
            Machine credentials for the REST API. Secrets are hashed at rest — only the prefix is
            stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {clients.isLoading ? (
            <InlineLoader label="Loading API clients" />
          ) : (clients.data ?? []).length === 0 ? (
            <EmptyState
              title="No API clients"
              description="Integrations that call CampusOS will be listed here."
            />
          ) : (
            <ul className="divide-y">
              {(clients.data ?? []).map((client) => (
                <li key={client.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.key_prefix}··· · {client.scopes.join(", ") || "no scopes"} ·{" "}
                      {client.rate_limit_per_minute}/min · last used{" "}
                      {formatDateTime(client.last_used_at)}
                    </p>
                  </div>
                  <Badge variant={client.is_active ? "default" : "secondary"}>
                    {client.is_active ? "Active" : "Revoked"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook endpoints</CardTitle>
          <CardDescription>Where CampusOS posts events as they happen.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {endpoints.isLoading ? (
            <InlineLoader label="Loading endpoints" />
          ) : (endpoints.data ?? []).length === 0 ? (
            <EmptyState
              title="No webhook endpoints"
              description="Register an endpoint to receive event callbacks."
            />
          ) : (
            <ul className="divide-y">
              {(endpoints.data ?? []).map((endpoint) => (
                <li key={endpoint.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{endpoint.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {endpoint.url}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {endpoint.events.join(", ") || "no events"} · up to {endpoint.max_retries}{" "}
                      retries
                    </p>
                  </div>
                  <Badge variant={endpoint.is_active ? "default" : "secondary"}>
                    {endpoint.is_active ? "Active" : "Paused"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent deliveries</CardTitle>
          <CardDescription>The last 20 outbound webhook attempts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {deliveries.isLoading ? (
            <InlineLoader label="Loading deliveries" />
          ) : (deliveries.data ?? []).length === 0 ? (
            <EmptyState
              title="No deliveries yet"
              description="Delivery attempts appear once events start firing."
            />
          ) : (
            <ul className="divide-y">
              {(deliveries.data ?? []).map((delivery) => (
                <li key={delivery.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm capitalize">{delivery.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.attempts} attempt(s) · HTTP {delivery.response_status ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(delivery.delivered_at ?? delivery.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
