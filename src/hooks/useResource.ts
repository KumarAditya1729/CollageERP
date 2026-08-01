import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, unknown>;

interface ResourceOptions {
  table: string;
  select: string;
  orderBy?: { column: string; ascending?: boolean };
  /** Scope rows to the active campus when the table has a campus_id column. */
  campusScoped?: boolean;
  softDelete?: boolean;
}

export function useResourceList<T extends Row>({
  table,
  select,
  orderBy,
  campusScoped,
  softDelete = true,
}: ResourceOptions) {
  const { tenant, campus } = useAccess();

  return useQuery({
    queryKey: ["resource", table, tenant?.id, campusScoped ? (campus?.id ?? null) : null],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      let builder = supabase
        .from(table as never)
        .select(select)
        .eq("tenant_id", tenant!.id);
      if (softDelete) builder = builder.is("deleted_at", null);
      if (campusScoped && campus?.id) builder = builder.eq("campus_id", campus.id);
      if (orderBy)
        builder = builder.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      const { data, error } = await builder.limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

export function useResourceMutations({
  table,
  softDelete = true,
}: {
  table: string;
  softDelete?: boolean;
}) {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resource", table] });

  const create = useMutation({
    mutationFn: async (values: Row) => {
      const { error } = await supabase
        .from(table as never)
        .insert({ ...values, tenant_id: tenant?.id, created_by: user?.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record created");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Row }) => {
      const { error } = await supabase
        .from(table as never)
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changes saved");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const query = supabase.from(table as never);
      const { error } = softDelete
        ? await query
            .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id } as never)
            .in("id", ids)
        : await query.delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      toast.success(ids.length > 1 ? `${ids.length} records removed` : "Record removed");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { create, update, remove };
}
