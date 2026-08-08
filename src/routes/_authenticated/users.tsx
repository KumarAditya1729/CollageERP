import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialsOf } from "@/components/layout/user-menu";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { inviteUser } from "@/lib/users.functions";
import { formatDate } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users — CampusOS" },
      {
        name: "description",
        content: "Manage workspace members, invitations and their assigned roles.",
      },
      { property: "og:title", content: "Users — CampusOS" },
      { property: "og:description", content: "Workspace members and role assignments." },
    ],
  }),
  component: UsersPage,
});

interface MemberRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  employee_code: string | null;
  profiles: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

function UsersPage() {
  const { tenant, can } = useAccess();
  const queryClient = useQueryClient();
  const canInvite = can("user.invite");
  const canAssign = can("role.assign");
  const invite = useServerFn(inviteUser);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const members = useQuery({
    queryKey: ["tenant-members", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select(
          "id, user_id, status, joined_at, employee_code, profiles!tenant_members_user_id_fkey(full_name, email, avatar_url)",
        )
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MemberRow[];
    },
  });

  const roles = useQuery({
    queryKey: ["assignable-roles", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, key, name, level")
        .is("deleted_at", null)
        .eq("is_assignable", true)
        .order("level", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignments = useQuery({
    queryKey: ["user-roles", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role_id, roles(name)")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        user_id: string;
        role_id: string;
        roles: { name: string } | null;
      }[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId, tenant_id: tenant!.id, scope: "tenant" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role assigned");
      void queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role revoked");
      void queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rolesFor = (userId: string) =>
    (assignments.data ?? []).filter((row) => row.user_id === userId);

  const submitInvite = async () => {
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      await invite({
        data: {
          email: parsed.data,
          tenantId: tenant!.id,
          roleId: roleId || undefined,
          redirectTo: window.location.origin,
        },
      });
      toast.success(`Invitation sent to ${parsed.data}`);
      setInviteOpen(false);
      setEmail("");
      setRoleId("");
      void queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with access to this college workspace, along with their assigned roles."
        crumbs={[{ label: "Administration" }, { label: "Users" }]}
        actions={
          canInvite ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite user
            </Button>
          ) : null
        }
      />

      <DataTable<MemberRow>
        columns={[
          {
            key: "name",
            header: "Member",
            alwaysVisible: true,
            value: (row) => row.profiles?.full_name ?? row.profiles?.email ?? row.user_id,
            render: (row) => (
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={row.profiles?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {initialsOf(row.profiles?.full_name ?? row.profiles?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {row.profiles?.full_name ?? "Pending member"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.profiles?.email}</p>
                </div>
              </div>
            ),
          },
          { key: "employee_code", header: "Employee code", defaultHidden: true },
          {
            key: "roles",
            header: "Roles",
            sortable: false,
            value: (row) =>
              rolesFor(row.user_id)
                .map((item) => item.roles?.name)
                .join(", "),
            render: (row) => {
              const assigned = rolesFor(row.user_id);
              return (
                <div className="flex flex-wrap items-center gap-1">
                  {assigned.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No roles</span>
                  ) : (
                    assigned.map((item) => (
                      <Badge key={item.id} variant="secondary" className="gap-1">
                        {item.roles?.name}
                        {canAssign ? (
                          <button
                            type="button"
                            aria-label={`Revoke ${item.roles?.name}`}
                            onClick={() => void revokeRole.mutateAsync(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        ) : null}
                      </Badge>
                    ))
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge
                variant={row.status === "active" ? "default" : "secondary"}
                className="capitalize"
              >
                {row.status}
              </Badge>
            ),
          },
          {
            key: "joined_at",
            header: "Joined",
            value: (row) => row.joined_at,
            render: (row) => formatDate(row.joined_at),
          },
        ]}
        rows={members.data}
        getRowId={(row) => row.id}
        loading={members.isLoading}
        error={(members.error as Error) ?? null}
        onRetry={() => void members.refetch()}
        storageKey="users"
        exportName="users"
        searchPlaceholder="Search members…"
        emptyTitle="No members yet"
        emptyDescription="Invite colleagues to collaborate in this workspace."
        rowActions={(row) =>
          canAssign ? (
            <Select
              onValueChange={(value) =>
                void assignRole.mutateAsync({ userId: row.user_id, roleId: value })
              }
            >
              <SelectTrigger className="h-8 w-[150px]" aria-label="Assign role">
                <SelectValue placeholder="Assign role" />
              </SelectTrigger>
              <SelectContent>
                {(roles.data ?? []).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              We'll email an invitation link. The person joins this college workspace once they
              accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="colleague@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role (optional)</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(roles.data ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void submitInvite()} disabled={busy}>
              {busy ? (
                "Sending…"
              ) : (
                <>
                  <Mail className="size-4" /> Send invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
