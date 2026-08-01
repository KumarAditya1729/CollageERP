import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export interface JobPositionRow {
  id: string;
  tenant_id: string;
  department_id: string | null;
  designation_id: string | null;
  title: string;
  description: string | null;
  openings: number;
  employment_type: string;
  status: string;
  posted_date: string | null;
  closing_date: string | null;
  salary_min: number | null;
  salary_max: number | null;
}

export interface ApplicantRow {
  id: string;
  tenant_id: string;
  job_position_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  resume_url: string | null;
  stage: string;
  source: string | null;
  applied_date: string;
}

export function useJobPositions() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["job_positions", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_job_positions")
        .select("*")
        .order("posted_date", { ascending: false });
      if (error) throw error;
      return data as JobPositionRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useApplicants(jobPositionId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["applicants", tenant?.id, jobPositionId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from("hr_applicants")
        .select("*")
        .order("applied_date", { ascending: false });
      if (jobPositionId) query = query.eq("job_position_id", jobPositionId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ApplicantRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateJobPosition() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<JobPositionRow>) => {
      const { data, error } = await supabase
        .from("hr_job_positions")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_positions"] });
    },
  });
}

export function useUpdateApplicantStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { data, error } = await supabase
        .from("hr_applicants")
        .update({ stage })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
    },
  });
}
