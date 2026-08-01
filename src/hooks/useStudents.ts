import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";
import { STUDENT_SELECT, type StudentRecord } from "@/lib/students";

export interface LookupRow {
  id: string;
  name: string;
  code?: string | null;
}

export interface MasterItem {
  id: string;
  code: string;
  label: string;
  type_key: string;
}

/** Departments, programmes, semesters, years and master data used across the SIS. */
export function useStudentLookups() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["student-lookups", tenant?.id],
    enabled: Boolean(tenant?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const [departments, programs, semesters, years, sessions, master] = await Promise.all([
        supabase
          .from("departments")
          .select("id, name, code")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("programs")
          .select("id, name, code, department_id")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("semesters")
          .select("id, name, number, program_id")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("number"),
        supabase
          .from("academic_years")
          .select("id, name, is_current")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("name", { ascending: false }),
        supabase
          .from("academic_sessions")
          .select("id, name, academic_year_id, is_current")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("term_number"),
        supabase
          .from("master_data_items")
          .select("id, code, label, is_active, master_data_types(key)")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("sort_order"),
      ]);

      for (const result of [departments, programs, semesters, years, sessions, master]) {
        if (result.error) throw result.error;
      }

      const masterItems = (
        (master.data ?? []) as unknown as {
          id: string;
          code: string;
          label: string;
          is_active: boolean;
          master_data_types: { key: string } | null;
        }[]
      )
        .filter((row) => row.is_active !== false)
        .map((row) => ({
          id: row.id,
          code: row.code,
          label: row.label,
          type_key: row.master_data_types?.key ?? "",
        }));

      const byType = (key: string) => masterItems.filter((item) => item.type_key === key);

      return {
        departments: (departments.data ?? []) as LookupRow[],
        programs: (programs.data ?? []) as unknown as (LookupRow & {
          department_id: string | null;
        })[],
        semesters: (semesters.data ?? []) as unknown as {
          id: string;
          name: string;
          number: number;
          program_id: string;
        }[],
        years: (years.data ?? []) as unknown as { id: string; name: string; is_current: boolean }[],
        sessions: (sessions.data ?? []) as unknown as {
          id: string;
          name: string;
          academic_year_id: string;
          is_current: boolean;
        }[],
        bloodGroups: byType("blood_group"),
        religions: byType("religion"),
        castes: byType("caste"),
        categories: byType("category"),
        nationalities: byType("nationality"),
        languages: byType("language"),
      };
    },
  });
}

/** The full student register for the active tenant/campus. */
export function useStudentRegister({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) {
  const { tenant, campus } = useAccess();

  return useQuery({
    queryKey: ["students-register", tenant?.id, campus?.id ?? null, includeArchived],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let builder = supabase.from("students").select(STUDENT_SELECT).eq("tenant_id", tenant!.id);
      if (!includeArchived) builder = builder.is("deleted_at", null);
      if (campus?.id) builder = builder.eq("campus_id", campus.id);
      const { data, error } = await builder.order("admission_number").limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as StudentRecord[];
    },
  });
}

export function useStudent(id: string | undefined) {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["student", id, tenant?.id],
    enabled: Boolean(id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(STUDENT_SELECT)
        .eq("tenant_id", tenant!.id)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as StudentRecord | null;
    },
  });
}

export function useStudentGuardians(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-guardians", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("id, full_name, relation, email, phone, occupation, annual_income, is_primary")
        .eq("student_id", studentId!)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        full_name: string;
        relation: string;
        email: string | null;
        phone: string | null;
        occupation: string | null;
        annual_income: number | null;
        is_primary: boolean;
      }[];
    },
  });
}

/** Shared write helpers: every mutation is audited by the database triggers. */
export function useStudentMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["students-register"] });
    void queryClient.invalidateQueries({ queryKey: ["student"] });
    void queryClient.invalidateQueries({ queryKey: ["student-stats"] });
  }, [queryClient]);

  const createStudent = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("students")
        .insert({ ...values, tenant_id: tenant!.id, created_by: user?.id ?? null } as never)
        .select("id, admission_number, user_id")
        .single();
      if (error) throw error;

      // Integration 1: Auto-create Library Membership
      if (data.admission_number) {
        await supabase.from("lib_members" as unknown as never).insert({
          tenant_id: tenant!.id,
          user_id: data.user_id || user?.id, // Fallback if no user_id created yet
          member_number: data.admission_number,
          member_type: "student",
          status: "active",
          joined_date: new Date().toISOString().split("T")[0],
        } as unknown as never);
      }

      // Integration 2: Auto-create Hostel Eligibility (Waiting List)
      await supabase.from("hos_waiting_list" as unknown as never).insert({
        tenant_id: tenant!.id,
        student_id: data.id,
        status: "waiting",
        application_date: new Date().toISOString().split("T")[0],
      } as unknown as never);

      // Integration 3: Auto-create Transport Eligibility is skipped because trn_student_allocations requires route_id and stops which we don't have at admission.

      // Integration 4: Audit, Search, and Timeline
      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: user?.id ?? null,
        action: "create",
        entity_type: "students",
        entity_id: data.id,
        entity_label: data.admission_number as string,
        new_data: values,
        module: "students",
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenant!.id,
        entity_type: "students",
        entity_id: data.id,
        title: String(values.first_name || "") + " " + String(values.last_name || ""),
        subtitle: `Admission Number: ${data.admission_number}`,
        url: `/_authenticated/students/${data.id}`,
        module: "students",
      });

      await integrationService.insertTimelineEntry({
        tenant_id: tenant!.id,
        actor_id: user?.id ?? null,
        entity_type: "students",
        entity_id: data.id,
        module: "students",
        verb: "ADMITTED",
        summary: `Student admitted with admission number ${data.admission_number}`,
      });

      return data.id as string;
    },
    onSuccess: () => {
      toast.success("Student created and integrations configured");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStudent = useMutation({
    mutationFn: async ({ ids, values }: { ids: string[]; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("students")
        .update({ ...values, updated_by: user?.id ?? null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.ids.length > 1 ? `${variables.ids.length} students updated` : "Student updated",
      );
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveStudents = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("students")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      toast.success(ids.length > 1 ? `${ids.length} students archived` : "Student archived");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restoreStudents = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("students")
        .update({ deleted_at: null, deleted_by: null, updated_by: user?.id ?? null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student restored");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createStudent, updateStudent, archiveStudents, restoreStudents, invalidate };
}
