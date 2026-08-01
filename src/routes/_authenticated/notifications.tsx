import { createFileRoute } from "@tanstack/react-router";
import { Archive, Bell, Check, Undo2 } from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CampusOS" },
      {
        name: "description",
        content: "Read, filter and archive every alert sent to your CampusOS account.",
      },
      { property: "og:title", content: "Notifications — CampusOS" },
      { property: "og:description", content: "Your CampusOS notification center." },
    ],
  }),
  component: NotificationsPage,
});

type Filter = "all" | "unread" | "archived";

function NotificationsPage() {
  const { items, isLoading, error, refetch, markRead, markUnread, archive, restore, busy } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = items.filter((item) =>
    filter === "archived"
      ? item.archived_at
      : filter === "unread"
        ? !item.read_at && !item.archived_at
        : !item.archived_at,
  );

  return (
    <>
      <PageHeader
        title="Notification center"
        description="Every alert delivered to your account across admissions, academics, approvals and documents."
        crumbs={[{ label: "Operations" }, { label: "Notifications" }]}
        actions={
          <Button
            variant="outline"
            disabled={busy || items.every((item) => item.read_at)}
            onClick={() =>
              void markRead(items.filter((item) => !item.read_at).map((item) => item.id))
            }
          >
            <Check className="size-4" />
            Mark all read
          </Button>
        }
      />

      <DataTable<NotificationRow>
        columns={[
          {
            key: "title",
            header: "Notification",
            alwaysVisible: true,
            render: (row) => (
              <div className="min-w-0">
                <p className={row.read_at ? "text-sm" : "text-sm font-semibold"}>{row.title}</p>
                {row.body ? <p className="text-xs text-muted-foreground">{row.body}</p> : null}
              </div>
            ),
            value: (row) => `${row.title} ${row.body ?? ""}`,
          },
          {
            key: "priority",
            header: "Priority",
            render: (row) => (
              <Badge
                variant={
                  row.priority === "urgent" || row.priority === "high" ? "destructive" : "secondary"
                }
                className="capitalize"
              >
                {row.priority}
              </Badge>
            ),
          },
          { key: "event_key", header: "Event", defaultHidden: true },
          {
            key: "read_at",
            header: "State",
            value: (row) => (row.archived_at ? "Archived" : row.read_at ? "Read" : "Unread"),
          },
          {
            key: "created_at",
            header: "Received",
            value: (row) => row.created_at,
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={rows}
        getRowId={(row) => row.id}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        storageKey="notifications"
        exportName="notifications"
        searchPlaceholder="Search notifications…"
        emptyTitle="No notifications"
        emptyDescription="Alerts about approvals, admissions and academics will appear here."
        filters={
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="all">Inbox</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        bulkActions={(ids, clear) => (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={async () => {
                await markRead(ids);
                clear();
              }}
            >
              <Check className="size-4" />
              Mark read
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={async () => {
                await archive(ids);
                clear();
              }}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </>
        )}
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={busy}
              aria-label={row.read_at ? "Mark unread" : "Mark read"}
              onClick={() => void (row.read_at ? markUnread([row.id]) : markRead([row.id]))}
            >
              {row.read_at ? <Undo2 className="size-4" /> : <Check className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={busy}
              aria-label={row.archived_at ? "Restore" : "Archive"}
              onClick={() => void (row.archived_at ? restore([row.id]) : archive([row.id]))}
            >
              {row.archived_at ? <Bell className="size-4" /> : <Archive className="size-4" />}
            </Button>
          </div>
        )}
      />
    </>
  );
}
