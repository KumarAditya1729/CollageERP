import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "./useAccess";
import { toast } from "sonner";

export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

export interface LibraryIssue {
  id: string;
  book_id: string;
  user_id: string;
  issue_date: string;
  due_date: string | null;
  return_date: string | null;
  status: "issued" | "returned" | "overdue";
}

export function useLibraryBooks() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["library_books", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("title");
      if (error) throw error;
      return data as LibraryBook[];
    },
    enabled: !!tenant?.id,
  });
}

export function useLibraryIssues() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["library_issues", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("library_issues")
        .select("*, library_books(*), profiles(*)")
        .eq("tenant_id", tenant.id)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}
