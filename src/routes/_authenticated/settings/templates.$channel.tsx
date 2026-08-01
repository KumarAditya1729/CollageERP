import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusPage } from "@/components/common/status-page";
import { EmptyState, ErrorState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Channel = Database["public"]["Enums"]["notification_channel"];

export const CHANNEL_BY_SLUG: Record<
  string,
  { channel: Channel; label: string; hasSubject: boolean }
> = {
  email: { channel: "email", label: "Email", hasSubject: true },
  sms: { channel: "sms", label: "SMS", hasSubject: false },
  whatsapp: { channel: "whatsapp", label: "WhatsApp", hasSubject: false },
  push: { channel: "push", label: "Push", hasSubject: true },
};

export const Route = createFileRoute("/_authenticated/settings/templates/$channel")({
  head: ({ params }) => {
    const label = CHANNEL_BY_SLUG[params.channel]?.label ?? "Message";
    return {
      meta: [
        { title: `${label} templates — CampusOS` },
        {
          name: "description",
          content: `Author and manage ${label} notification templates for your college.`,
        },
        { property: "og:title", content: `${label} templates — CampusOS` },
        {
          property: "og:description",
          content: `Manage ${label} notification templates in CampusOS.`,
        },
      ],
    };
  },
  beforeLoad: ({ params }) => {
    if (!CHANNEL_BY_SLUG[params.channel]) throw notFound();
  },
  component: TemplatesPage,
  errorComponent: ({ error }) => (
    <StatusPage code="500" title="Templates unavailable" description={error.message} />
  ),
  notFoundComponent: () => (
    <StatusPage
      code="404"
      title="Unknown channel"
      description="That messaging channel is not configured."
    />
  ),
});

const templateSchema = z.object({
  name: z.string().trim().min(2, "Give the template a name").max(120),
  key: z
    .string()
    .trim()
    .min(2, "Add a unique key")
    .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, numbers, dots, dashes"),
  event_key: z.string().trim().min(2, "Add the event this template answers to").max(120),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(5, "Write the message body"),
});

const EMPTY = { name: "", key: "", event_key: "", subject: "", body: "" };

function TemplatesPage() {
  const { channel: slug } = Route.useParams();
  const meta = CHANNEL_BY_SLUG[slug];
  const { tenant } = useAccess();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{ id: string | null; values: typeof EMPTY } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ["notification-templates", tenant?.id, meta.channel],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("id, key, name, event_key, subject, body, is_active, updated_at")
        .eq("tenant_id", tenant!.id)
        .eq("channel", meta.channel)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["notification-templates", tenant?.id, meta.channel],
    });

  const upsert = useMutation({
    mutationFn: async (input: { id: string | null; values: typeof EMPTY }) => {
      const parsed = templateSchema.parse(input.values);
      const payload = {
        tenant_id: tenant!.id,
        channel: meta.channel,
        key: parsed.key,
        name: parsed.name,
        event_key: parsed.event_key,
        subject: meta.hasSubject ? parsed.subject || null : null,
        body: parsed.body,
      };
      const { error } = input.id
        ? await supabase.from("notification_templates").update(payload).eq("id", input.id)
        : await supabase.from("notification_templates").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template saved");
      setEditing(null);
      void invalidate();
    },
    onError: (error: Error) =>
      toast.error(error instanceof z.ZodError ? error.issues[0].message : error.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("notification_templates")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_templates")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removed");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{meta.label} templates</CardTitle>
            <CardDescription>
              Templates the notification engine renders when an event fires. Use {"{{"}variable
              {"}}"} placeholders.
            </CardDescription>
          </div>
          <Button onClick={() => setEditing({ id: null, values: EMPTY })}>
            <Plus className="size-4" />
            New template
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {templates.isLoading ? (
            <InlineLoader label="Loading templates" />
          ) : templates.error ? (
            <ErrorState
              description={(templates.error as Error).message}
              onRetry={() => void templates.refetch()}
            />
          ) : (templates.data ?? []).length === 0 ? (
            <EmptyState
              title={`No ${meta.label.toLowerCase()} templates yet`}
              description="Create a template so the notification engine has something to send."
            />
          ) : (
            <ul className="divide-y">
              {(templates.data ?? []).map((template) => (
                <li key={template.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {template.event_key}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {template.subject ? `${template.subject} — ` : ""}
                      {template.body}
                    </p>
                  </div>
                  <Switch
                    checked={template.is_active}
                    aria-label="Template active"
                    onCheckedChange={(checked) =>
                      void toggleActive.mutateAsync({ id: template.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditing({
                        id: template.id,
                        values: {
                          name: template.name,
                          key: template.key,
                          event_key: template.event_key ?? "",
                          subject: template.subject ?? "",
                          body: template.body,
                        },
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Delete template"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Placeholders such as {"{{"}student_name{"}}"} are replaced when the message is sent.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tpl-name">Name</Label>
                  <Input
                    id="tpl-name"
                    value={editing.values.name}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        values: { ...editing.values, name: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-key">Key</Label>
                  <Input
                    id="tpl-key"
                    value={editing.values.key}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        values: { ...editing.values, key: event.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-event">Event key</Label>
                <Input
                  id="tpl-event"
                  value={editing.values.event_key}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      values: { ...editing.values, event_key: event.target.value },
                    })
                  }
                />
              </div>
              {meta.hasSubject ? (
                <div className="space-y-2">
                  <Label htmlFor="tpl-subject">Subject</Label>
                  <Input
                    id="tpl-subject"
                    value={editing.values.subject}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        values: { ...editing.values, subject: event.target.value },
                      })
                    }
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="tpl-body">Message</Label>
                <Textarea
                  id="tpl-body"
                  rows={7}
                  value={editing.values.body}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      values: { ...editing.values, body: event.target.value },
                    })
                  }
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={upsert.isPending}
              onClick={() => editing && void upsert.mutateAsync(editing)}
            >
              {upsert.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => (open ? null : setDeleteId(null))}
        title="Delete template?"
        description="The template is archived and will no longer be used by the notification engine."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteId) await remove.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </>
  );
}
