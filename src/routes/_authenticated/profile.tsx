import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Laptop, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialsOf } from "@/components/layout/user-menu";
import { useTheme } from "@/components/theme/theme-provider";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — CampusOS" },
      {
        name: "description",
        content: "Manage your personal details, security, sessions and notification preferences.",
      },
      { property: "og:title", content: "Your profile — CampusOS" },
      { property: "og:description", content: "Your CampusOS account settings." },
    ],
  }),
  component: ProfilePage,
});

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
];

const NOTIFICATION_EVENTS = [
  { key: "workflow.assigned", label: "Approval assigned to me" },
  { key: "document.verified", label: "Document verified or rejected" },
  { key: "attendance.alert", label: "Attendance alerts" },
  { key: "fee.due", label: "Fee reminders" },
  { key: "announcement.published", label: "Notices and announcements" },
];

const CHANNELS = ["in_app", "email", "sms", "whatsapp"] as const;

function ProfilePage() {
  const { user } = useAuth();
  const { tenant, roles, isPlatformAdmin } = useAccess();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, display_name, email, phone, avatar_url, locale, timezone, date_of_birth",
        )
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    full_name: "",
    display_name: "",
    phone: "",
    locale: "en",
    timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      full_name: profile.data.full_name ?? "",
      display_name: profile.data.display_name ?? "",
      phone: profile.data.phone ?? "",
      locale: profile.data.locale ?? "en",
      timezone: profile.data.timezone ?? "Asia/Kolkata",
    });
  }, [profile.data]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({
          full_name: z.string().trim().min(2, "Enter your full name").max(120),
          display_name: z.string().trim().max(60).optional(),
          phone: z.string().trim().max(20).optional(),
          locale: z.string(),
          timezone: z.string(),
        })
        .parse(form);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.full_name,
          display_name: parsed.display_name || null,
          phone: parsed.phone || null,
          locale: parsed.locale,
          timezone: parsed.timezone,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error: Error) =>
      toast.error(error instanceof z.ZodError ? error.issues[0].message : error.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/avatar-${Date.now()}-${file.name}`;
      const { error: storageError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
      });
      if (storageError) throw storageError;
      const { data, error: signError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signError) throw signError;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: data.signedUrl })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo updated");
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [password, setPassword] = useState({ next: "", confirm: "" });
  const changePassword = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({ next: z.string().min(8, "Use at least 8 characters"), confirm: z.string() })
        .refine((value) => value.next === value.confirm, { message: "Passwords do not match" })
        .parse(password);
      const { error } = await supabase.auth.updateUser({ password: parsed.next });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password changed");
      setPassword({ next: "", confirm: "" });
    },
    onError: (error: Error) =>
      toast.error(error instanceof z.ZodError ? error.issues[0].message : error.message),
  });

  const preferences = useQuery({
    queryKey: ["notification-preferences", user?.id, tenant?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("id, event_key, channel, enabled")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setPreference = useMutation({
    mutationFn: async ({
      eventKey,
      channel,
      enabled,
    }: {
      eventKey: string;
      channel: (typeof CHANNELS)[number];
      enabled: boolean;
    }) => {
      const { error } = await supabase.from("notification_preferences").upsert(
        {
          user_id: user!.id,
          tenant_id: tenant?.id ?? null,
          event_key: eventKey,
          channel,
          enabled,
        },
        { onConflict: "user_id,tenant_id,event_key,channel" },
      );
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const securityActivity = useQuery({
    queryKey: ["security-activity", user?.id, tenant?.id],
    enabled: Boolean(user?.id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, ip_address, user_agent, created_at")
        .eq("tenant_id", tenant!.id)
        .eq("actor_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const apiClients = useQuery({
    queryKey: ["api-clients", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_clients")
        .select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const identities = user?.identities ?? [];
  const preferenceFor = (eventKey: string, channel: string) =>
    (preferences.data ?? []).find((row) => row.event_key === eventKey && row.channel === channel)
      ?.enabled ?? channel === "in_app";

  return (
    <>
      <PageHeader
        title="Your profile"
        description="Personal details, security, devices and how CampusOS contacts you."
        crumbs={[{ label: "Account" }, { label: "Profile" }]}
      />

      <Tabs defaultValue="personal">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions & devices</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="tokens">API tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Shown to colleagues across CampusOS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={profile.data?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>
                    {initialsOf(profile.data?.full_name ?? user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Label htmlFor="avatar" className="text-sm font-medium">
                    Profile photo
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="w-64"
                    disabled={uploadAvatar.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadAvatar.mutateAsync(file);
                      event.target.value = "";
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={form.full_name}
                    onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    value={form.display_name}
                    onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.data?.email ?? user?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Language</Label>
                  <Select
                    value={form.locale}
                    onValueChange={(value) => setForm({ ...form, locale: value })}
                  >
                    <SelectTrigger id="locale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCALES.map((locale) => (
                        <SelectItem key={locale.value} value={locale.value}>
                          {locale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={form.timezone}
                    onValueChange={(value) => setForm({ ...form, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => void saveProfile.mutateAsync()}
                  disabled={saveProfile.isPending}
                >
                  {saveProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
                <p className="text-xs text-muted-foreground">
                  Roles: {roles.map((role) => role.name).join(", ") || "None assigned"}
                  {isPlatformAdmin ? " · Platform administrator" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Use at least 8 characters with a mix of letters and numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password.next}
                    onChange={(event) => setPassword({ ...password, next: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password.confirm}
                    onChange={(event) => setPassword({ ...password, confirm: event.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={() => void changePassword.mutateAsync()}
                disabled={changePassword.isPending}
              >
                Update password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                Add a second step when signing in. Enrolment opens once your college enables it in
                Settings → Security.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3.5" /> Not enrolled
              </Badge>
              <Button variant="outline" disabled title="Awaiting college-level activation">
                Set up authenticator app
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected accounts</CardTitle>
              <CardDescription>Sign-in providers linked to your CampusOS account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {identities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No external providers linked.</p>
              ) : (
                identities.map((identity) => (
                  <div
                    key={identity.identity_id ?? identity.provider}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{identity.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        Linked {formatDateTime(identity.created_at ?? null)}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security activity</CardTitle>
              <CardDescription>Recent actions recorded against your account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {securityActivity.isLoading ? (
                <InlineLoader label="Loading activity" />
              ) : (securityActivity.data ?? []).length === 0 ? (
                <EmptyState
                  title="No recorded activity"
                  description="Your recent actions will appear here."
                />
              ) : (
                <ul className="divide-y">
                  {(securityActivity.data ?? []).map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm capitalize">
                          {row.action} · {row.entity_type}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {String(row.ip_address ?? "Unknown IP")} ·{" "}
                          {row.user_agent ?? "Unknown device"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current session</CardTitle>
              <CardDescription>
                CampusOS keeps one refreshable session per browser. Signing out everywhere ends them
                all.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
                    <Laptop className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">This device</p>
                    <p className="text-xs text-muted-foreground">
                      Signed in {formatDateTime(user?.last_sign_in_at ?? null)}
                    </p>
                  </div>
                </div>
                <Badge>Active now</Badge>
              </div>
              <Separator />
              <Button
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut({ scope: "others" });
                  if (error) toast.error(error.message);
                  else toast.success("Signed out of all other devices");
                }}
              >
                Sign out of other devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Choose how CampusOS reaches you for each type of update.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-y text-left">
                      <th className="p-3 font-medium">Event</th>
                      {CHANNELS.map((channel) => (
                        <th key={channel} className="p-3 text-center font-medium capitalize">
                          {channel.replace("_", "-")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NOTIFICATION_EVENTS.map((event) => (
                      <tr key={event.key} className="border-b last:border-0">
                        <td className="p-3">{event.label}</td>
                        {CHANNELS.map((channel) => (
                          <td key={channel} className="p-3 text-center">
                            <Switch
                              checked={preferenceFor(event.key, channel)}
                              aria-label={`${event.label} via ${channel}`}
                              onCheckedChange={(checked) =>
                                void setPreference.mutateAsync({
                                  eventKey: event.key,
                                  channel,
                                  enabled: checked,
                                })
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Applies to this browser immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
                <SelectTrigger id="theme" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">Match system</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>API tokens</CardTitle>
                <CardDescription>
                  Tokens issued for this college. Secrets are hashed — only the prefix is stored.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                disabled
                title="Token issuing opens with the public API release"
              >
                <Plus className="size-4" />
                New token
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {apiClients.isLoading ? (
                <InlineLoader label="Loading tokens" />
              ) : (apiClients.data ?? []).length === 0 ? (
                <EmptyState
                  icon={KeyRound}
                  title="No API tokens issued"
                  description="Tokens for integrations and the public API will be listed here."
                />
              ) : (
                <ul className="divide-y">
                  {(apiClients.data ?? []).map((client) => (
                    <li
                      key={client.id}
                      className="flex items-center justify-between gap-3 px-6 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{client.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {client.key_prefix}··· · {client.scopes.join(", ") || "no scopes"} · last
                          used {formatDateTime(client.last_used_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Active" : "Revoked"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Revoke token"
                          disabled
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
