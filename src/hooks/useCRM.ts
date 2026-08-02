import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CRMLead, CRMFollowup } from "@/lib/crm";
import { useAccess } from "./useAccess";
import { useAuth } from "./useAuth";

export function useCRMLeads() {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["crm-leads", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*, assigned_profile:profiles!crm_leads_assigned_to_fkey(first_name, last_name), program:programs(name)")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CRMLead[];
    },
  });

  return query;
}

export function useCRMMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  const createLead = useMutation({
    mutationFn: async (values: Partial<CRMLead>) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .insert({
          ...values,
          tenant_id: tenant!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CRMLead> }) => {
      const { data, error } = await supabase
        .from("crm_leads")
        .update(values)
        .eq("id", id)
        .eq("tenant_id", tenant!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  return { createLead, updateLead };
}

export function useCRMFollowups(leadId?: string) {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["crm-followups", tenant?.id, leadId],
    enabled: Boolean(tenant?.id && leadId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_followups")
        .select("*, logger:profiles!crm_followups_logged_by_fkey(first_name, last_name)")
        .eq("tenant_id", tenant!.id)
        .eq("lead_id", leadId!)
        .order("date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CRMFollowup[];
    },
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const logFollowup = useMutation({
    mutationFn: async (values: Partial<CRMFollowup>) => {
      const { data, error } = await supabase
        .from("crm_followups")
        .insert({
          ...values,
          tenant_id: tenant!.id,
          logged_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crm-followups"] });
      // Update the lead's status automatically if needed, we might invalidate leads too
      void queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  return { ...query, logFollowup };
}
