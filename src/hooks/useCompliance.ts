import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatutoryReport } from "@/lib/compliance";
import { useAccess } from "./useAccess";

export function useStatutoryReports(status?: string) {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["statutory_reports", tenant?.id, status],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let q = supabase
        .from("statutory_reports")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (status) {
        q = q.eq("status", status);
      }

      const { data, error } = await q;

      if (error) throw error;
      return (data ?? []) as unknown as StatutoryReport[];
    },
  });

  return query;
}

export function useComplianceMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  const createReport = useMutation({
    mutationFn: async (values: Partial<StatutoryReport>) => {
      const { data, error } = await supabase
        .from("statutory_reports")
        .insert({
          ...values,
          tenant_id: tenant!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as StatutoryReport;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["statutory_reports"] });
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<StatutoryReport> }) => {
      const { data, error } = await supabase
        .from("statutory_reports")
        .update(values)
        .eq("id", id)
        .eq("tenant_id", tenant!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as StatutoryReport;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["statutory_reports"] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("statutory_reports")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenant!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["statutory_reports"] });
    },
  });

  return { createReport, updateReport, deleteReport };
}
