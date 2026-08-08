import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "./useAccess";
import { toast } from "sonner";

export interface PlacementCompany {
  id: string;
  name: string;
  industry: string | null;
  hr_contact_name: string | null;
  hr_contact_email: string | null;
  hr_contact_phone: string | null;
  website_url: string | null;
  created_at: string;
}

export interface PlacementDrive {
  id: string;
  company_id: string;
  job_role: string;
  ctc_lpa: number | null;
  min_cgpa: number | null;
  drive_date: string | null;
  location: string | null;
  status: "upcoming" | "active" | "completed" | "cancelled";
  created_at: string;
}

export interface PlacementApplication {
  id: string;
  drive_id: string;
  student_id: string;
  status: "applied" | "shortlisted" | "interviewed" | "offered" | "rejected";
  resume_url: string | null;
  applied_at: string;
}

export function usePlacementCompanies() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["placement_companies", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("placement_companies")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("name");
      if (error) throw error;
      return data as PlacementCompany[];
    },
    enabled: !!tenant?.id,
  });
}

export function usePlacementDrives() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["placement_drives", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("placement_drives")
        .select("*, placement_companies(*)")
        .eq("tenant_id", tenant.id)
        .order("drive_date", { ascending: false });
      if (error) throw error;
      return data; // Drive joined with company
    },
    enabled: !!tenant?.id,
  });
}

export function usePlacementApplications(driveId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["placement_applications", tenant?.id, driveId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from("placement_applications")
        .select("*, profiles(*), placement_drives(*)")
        .eq("tenant_id", tenant.id);
      
      if (driveId) query = query.eq("drive_id", driveId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}
