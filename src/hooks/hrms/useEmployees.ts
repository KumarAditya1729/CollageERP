import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export interface StaffRow {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  department_id: string | null;
  user_id: string | null;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  designation: string | null;
  employment_type: string;
  employment_status: string;
  date_of_joining: string | null;
  date_of_leaving: string | null;
  photo_url: string | null;
}

export interface FacultyRow {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  department_id: string | null;
  user_id: string | null;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  employment_type: string;
  employment_status: string;
  date_of_joining: string | null;
  photo_url: string | null;
}

export interface EmployeeExtensionRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  designation_id: string | null;
  pay_grade_id: string | null;
  reporting_manager_id: string | null;
  confirmation_date: string | null;
  probation_end_date: string | null;
  notice_period_days: number;
  pan_number: string | null;
  aadhaar_number: string | null;
  uan_number: string | null;
  pf_number: string | null;
  esi_number: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_ifsc: string | null;
}

export function useStaffList() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["staff", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("first_name", { ascending: true });
      if (error) throw error;
      return data as StaffRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useFacultyList() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["faculty", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .order("first_name", { ascending: true });
      if (error) throw error;
      return data as FacultyRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useEmployeeExtension(staffId?: string, facultyId?: string) {
  return useQuery({
    queryKey: ["employee_extension", staffId, facultyId],
    queryFn: async () => {
      const query = supabase.from("hr_employee_extensions").select("*");
      if (staffId) query.eq("staff_id", staffId);
      else if (facultyId) query.eq("faculty_id", facultyId);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as EmployeeExtensionRow | null;
    },
    enabled: !!(staffId || facultyId),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffRow> }) => {
      const { data, error } = await supabase
        .from("staff")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDesignations() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hr_designations", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_designations")
        .select("*")
        .eq("is_active", true)
        .order("level", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}

export function usePayGrades() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hr_pay_grades", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_pay_grades")
        .select("*")
        .eq("is_active", true)
        .order("min_salary", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}
