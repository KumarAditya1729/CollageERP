import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface AppraisalCycleRow {
  id: string;
  tenant_id: string;
  name: string;
  cycle_type: string;
  start_date: string;
  end_date: string;
  self_review_deadline: string | null;
  manager_review_deadline: string | null;
  status: string;
}

export interface AppraisalRow {
  id: string;
  tenant_id: string;
  cycle_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  appraiser_id: string | null;
  self_rating: number | null;
  manager_rating: number | null;
  final_rating: number | null;
  self_review_notes: string | null;
  manager_review_notes: string | null;
  status: string;
  promotion_recommended: boolean;
  increment_recommended: boolean;
  recommended_increment_percent: number | null;
}

export interface GoalRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  appraisal_cycle_id: string | null;
  title: string;
  description: string | null;
  target_value: number | null;
  achieved_value: number | null;
  weightage: number;
  due_date: string | null;
  status: string;
}

export function useAppraisalCycles() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["appraisal_cycles", tenant?.id],
    queryFn: async (): Promise<AppraisalCycleRow[]> => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("hr_appraisal_cycles")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppraisalCycleRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useAppraisals(cycleId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["appraisals", tenant?.id, cycleId],
    queryFn: async (): Promise<AppraisalRow[]> => {
      if (!tenant?.id) return [];
      let query = db.from("hr_appraisals").select("*").eq("tenant_id", tenant.id);
      if (cycleId) query = query.eq("cycle_id", cycleId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AppraisalRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useGoals(staffId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["goals", tenant?.id, staffId],
    queryFn: async (): Promise<GoalRow[]> => {
      if (!tenant?.id) return [];
      let query = db
        .from("hr_goals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("due_date", { ascending: true });
      if (staffId) query = query.eq("staff_id", staffId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as GoalRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateAppraisalCycle() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<AppraisalCycleRow>): Promise<AppraisalCycleRow> => {
      const { data, error } = await db
        .from("hr_appraisal_cycles")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data as AppraisalCycleRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisal_cycles"] });
    },
  });
}

export function useSubmitSelfReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      self_rating,
      self_review_notes,
    }: {
      id: string;
      self_rating: number;
      self_review_notes: string;
    }): Promise<AppraisalRow> => {
      const { data, error } = await db
        .from("hr_appraisals")
        .update({ self_rating, self_review_notes, status: "manager_review" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AppraisalRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals"] });
    },
  });
}
