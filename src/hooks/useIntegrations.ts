import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantIntegration } from "@/lib/integrations";
import { useAccess } from "./useAccess";

export function useTenantIntegrations(category?: string) {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["tenant_integrations", tenant?.id, category],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let q = supabase
        .from("tenant_integrations")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("display_name", { ascending: true });

      if (category) {
        q = q.eq("category", category);
      }

      const { data, error } = await q;

      if (error) throw error;
      return (data ?? []) as unknown as TenantIntegration[];
    },
  });

  return query;
}

export function useIntegrationMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  const saveIntegration = useMutation({
    mutationFn: async ({
      provider_name,
      display_name,
      category,
      config,
      is_enabled,
      existingId,
    }: {
      provider_name: string;
      display_name: string;
      category: string;
      config: Record<string, any>;
      is_enabled: boolean;
      existingId?: string;
    }) => {
      if (existingId) {
        const { data, error } = await supabase
          .from("tenant_integrations")
          .update({
            config,
            is_enabled,
            status: is_enabled ? "connected" : "disconnected",
            last_sync_at: is_enabled ? new Date().toISOString() : null,
          })
          .eq("id", existingId)
          .eq("tenant_id", tenant!.id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as TenantIntegration;
      } else {
        const { data, error } = await supabase
          .from("tenant_integrations")
          .insert({
            tenant_id: tenant!.id,
            provider_name,
            display_name,
            category: category as any,
            config,
            is_enabled,
            status: is_enabled ? "connected" : "disconnected",
            last_sync_at: is_enabled ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data as unknown as TenantIntegration;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant_integrations"] });
    },
  });

  return { saveIntegration };
}
