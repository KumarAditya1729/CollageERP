import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesignTemplate } from "@/lib/design";
import { useAccess } from "./useAccess";

export function useTemplates(type?: string) {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["design_templates", tenant?.id, type],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let q = supabase
        .from("design_templates")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (type) {
        q = q.eq("type", type);
      }

      const { data, error } = await q;

      if (error) throw error;
      return (data ?? []) as unknown as DesignTemplate[];
    },
  });

  return query;
}

export function useTemplateMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  const createTemplate = useMutation({
    mutationFn: async (values: Partial<DesignTemplate>) => {
      const { data, error } = await supabase
        .from("design_templates")
        .insert({
          ...values,
          tenant_id: tenant!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as DesignTemplate;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["design_templates"] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<DesignTemplate> }) => {
      const { data, error } = await supabase
        .from("design_templates")
        .update(values)
        .eq("id", id)
        .eq("tenant_id", tenant!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as DesignTemplate;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["design_templates"] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("design_templates")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", id)
        .eq("tenant_id", tenant!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["design_templates"] });
    },
  });

  return { createTemplate, updateTemplate, deleteTemplate };
}
