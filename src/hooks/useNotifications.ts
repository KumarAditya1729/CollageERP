import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  priority: string;
  icon: string | null;
  action_url: string | null;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
  event_key: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, title, body, priority, icon, action_url, read_at, archived_at, created_at, event_key",
        )
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const channelId = `notifications-${user.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const patch = useMutation({
    mutationFn: async ({
      ids,
      values,
    }: {
      ids: string[];
      values: { read_at?: string | null; archived_at?: string | null };
    }) => {
      const { error } = await supabase.from("notifications").update(values).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const items = query.data ?? [];

  return {
    items,
    active: items.filter((item) => !item.archived_at),
    unreadCount: items.filter((item) => !item.read_at && !item.archived_at).length,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    refetch: () => void query.refetch(),
    markRead: (ids: string[]) =>
      patch.mutateAsync({ ids, values: { read_at: new Date().toISOString() } }),
    markUnread: (ids: string[]) => patch.mutateAsync({ ids, values: { read_at: null } }),
    archive: (ids: string[]) =>
      patch.mutateAsync({ ids, values: { archived_at: new Date().toISOString() } }),
    restore: (ids: string[]) => patch.mutateAsync({ ids, values: { archived_at: null } }),
    busy: patch.isPending,
  };
}
