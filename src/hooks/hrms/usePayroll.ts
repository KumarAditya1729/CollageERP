import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";

export interface PayrollRunRow {
  id: string;
  tenant_id: string;
  name: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string | null;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  processed_at: string | null;
  approved_at: string | null;
}

export interface PayslipRow {
  id: string;
  tenant_id: string;
  payroll_run_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  employee_code: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  working_days: number;
  present_days: number;
  leave_days: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  pf_employer: number;
  esi_employer: number;
  payslip_url: string | null;
  bank_transfer_status: string;
}

export interface SalaryStructureRow {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

export function usePayrollRuns() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["payroll_runs", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_payroll_runs")
        .select("*")
        .order("pay_period_start", { ascending: false });
      if (error) throw error;
      return data as PayrollRunRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function usePayslips(payrollRunId: string) {
  return useQuery({
    queryKey: ["payslips", payrollRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_payslips")
        .select("*")
        .eq("payroll_run_id", payrollRunId)
        .order("employee_name", { ascending: true });
      if (error) throw error;
      return data as PayslipRow[];
    },
    enabled: !!payrollRunId,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<PayrollRunRow>) => {
      const { data, error } = await supabase
        .from("hr_payroll_runs")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
    },
  });
}

export function useApprovePayrollRun() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase
        .from("hr_payroll_runs")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", runId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
    },
  });
}

export function useSalaryStructures() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["salary_structures", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_salary_structures")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as SalaryStructureRow[];
    },
    enabled: !!tenant?.id,
  });
}
