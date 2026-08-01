import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({
    meta: [
      { title: "Roles & permissions — CampusOS" },
      {
        name: "description",
        content: "Review the permission matrix and tune what each college role can do.",
      },
      { property: "og:title", content: "Roles & permissions — CampusOS" },
      { property: "og:description", content: "The CampusOS role and permission matrix." },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const { can } = useAccess();
  const queryClient = useQueryClient();
  const canManage = can("role.manage");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");

  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, key, name, level, description, is_system")
        .is("deleted_at", null)
        .order("level", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const permissions = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("id, key, name, module, description")
        .order("module")
        .order("key");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolePermissions = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("id, role_id, permission_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
      granted,
    }: {
      roleId: string;
      permissionId: string;
      granted: boolean;
    }) => {
      if (granted) {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role_id: roleId, permission_id: permissionId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", roleId)
          .eq("permission_id", permissionId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Permission matrix updated");
      void queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grantedSet = useMemo(
    () => new Set((rolePermissions.data ?? []).map((row) => `${row.role_id}:${row.permission_id}`)),
    [rolePermissions.data],
  );

  const modules = useMemo(
    () => Array.from(new Set((permissions.data ?? []).map((row) => row.module))).sort(),
    [permissions.data],
  );

  const visiblePermissions = (permissions.data ?? []).filter(
    (row) =>
      (module === "all" || row.module === module) &&
      (search.trim() === "" ||
        `${row.name} ${row.key}`.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const loading = roles.isLoading || permissions.isLoading || rolePermissions.isLoading;
  const error = (roles.error ?? permissions.error ?? rolePermissions.error) as Error | null;

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="Every capability in CampusOS is a permission. Roles bundle permissions, and row level security enforces them in the database."
        crumbs={[{ label: "Administration" }, { label: "Roles & permissions" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "permission-matrix",
                ["Permission", "Key", "Module", ...(roles.data ?? []).map((role) => role.name)],
                visiblePermissions.map((permission) => [
                  permission.name,
                  permission.key,
                  permission.module,
                  ...(roles.data ?? []).map((role) =>
                    grantedSet.has(`${role.id}:${permission.id}`) ? "yes" : "no",
                  ),
                ]),
              )
            }
          >
            Export matrix
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(roles.data ?? []).slice(0, 4).map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                {role.name}
                {role.is_system ? <Badge variant="outline">System</Badge> : null}
              </CardTitle>
              <CardDescription className="line-clamp-2">{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {(rolePermissions.data ?? []).filter((row) => row.role_id === role.id).length}{" "}
                permissions · level {role.level}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Permission matrix</CardTitle>
            <CardDescription>
              {canManage
                ? "Tick a box to grant a permission to a role."
                : "You have read-only access to the permission matrix."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search permissions…"
              className="w-full sm:w-56"
              aria-label="Search permissions"
            />
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <ErrorState
              description={error.message}
              onRetry={() => void rolePermissions.refetch()}
            />
          ) : loading ? (
            <TableSkeleton columns={6} rows={8} />
          ) : visiblePermissions.length === 0 ? (
            <EmptyState
              title="No permissions match"
              description="Try a different search term or module."
            />
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b">
                    <th className="sticky left-0 z-20 bg-card p-3 text-left font-medium">
                      Permission
                    </th>
                    {(roles.data ?? []).map((role) => (
                      <th key={role.id} className="whitespace-nowrap p-3 text-center font-medium">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePermissions.map((permission) => (
                    <tr key={permission.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="sticky left-0 z-10 bg-card p-3">
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-xs text-muted-foreground">{permission.key}</p>
                      </td>
                      {(roles.data ?? []).map((role) => {
                        const granted = grantedSet.has(`${role.id}:${permission.id}`);
                        return (
                          <td key={role.id} className="p-3 text-center">
                            <Checkbox
                              checked={granted}
                              disabled={!canManage || toggle.isPending}
                              aria-label={`${permission.name} for ${role.name}`}
                              onCheckedChange={(checked) =>
                                void toggle.mutateAsync({
                                  roleId: role.id,
                                  permissionId: permission.id,
                                  granted: Boolean(checked),
                                })
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
