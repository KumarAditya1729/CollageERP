import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SettingScope = Database["public"]["Enums"]["setting_scope"];

export interface SettingDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  scope: SettingScope;
  data_type: string;
  default_value: unknown;
  options: unknown;
  is_secret: boolean;
  sort_order: number;
}

/**
 * Reads the settings catalogue for a scope and merges it with the values
 * stored for the active college, so every settings screen is driven by the
 * database-backed settings engine rather than hardcoded fields.
 */
export function useSettings(scope: SettingScope) {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const definitions = useQuery({
    queryKey: ["settings-definitions", scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings_definitions")
        .select(
          "id, key, label, description, scope, data_type, default_value, options, is_secret, sort_order",
        )
        .eq("scope", scope)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as SettingDefinition[];
    },
  });

  const values = useQuery({
    queryKey: ["tenant-settings", tenant?.id, scope],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .select("id, key, value")
        .eq("tenant_id", tenant!.id)
        .eq("scope", scope);
      if (error) throw error;
      return data ?? [];
    },
  });

  const map = new Map((values.data ?? []).map((row) => [row.key, row.value]));

  const save = useMutation({
    mutationFn: async (entries: Record<string, unknown>) => {
      const rows = Object.entries(entries).map(([key, value]) => ({
        tenant_id: tenant!.id,
        scope,
        key,
        value: value as never,
        updated_by: user?.id ?? null,
        created_by: user?.id ?? null,
      }));
      if (rows.length === 0) return;
      const { error } = await supabase
        .from("tenant_settings")
        .upsert(rows, { onConflict: "tenant_id,campus_id,scope,key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["tenant-settings", tenant?.id, scope] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    definitions: definitions.data ?? [],
    valueFor: (definition: SettingDefinition) =>
      map.has(definition.key) ? map.get(definition.key) : definition.default_value,
    isLoading: definitions.isLoading || values.isLoading,
    error: (definitions.error ?? values.error) as Error | null,
    refetch: () => {
      void definitions.refetch();
      void values.refetch();
    },
    save: save.mutateAsync,
    saving: save.isPending,
  };
}
