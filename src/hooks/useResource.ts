import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

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
      const { data, error } = await supabase
        .from(table as never)
        .insert({ ...values, tenant_id: tenant?.id, created_by: user?.id } as never)
        .select("id")
        .single();
      if (error) throw error;

      // Automatic Audit Logging
      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: user?.id ?? null,
          action: "create",
          entity_type: table,
          entity_id: (data as { id?: string })?.id,
          new_data: values,
        });
      }

      // Automatic Search Indexing for configured entities
      const searchableTables = [
        "lib_books",
        "lib_copies",
        "lib_members",
        "hos_hostels",
        "hos_rooms",
        "hos_beds",
        "hos_allocations",
        "transport_vehicles",
        "transport_routes",
        "transport_stops",
        "transport_drivers",
      ];
      if (tenant?.id && searchableTables.includes(table)) {
        await integrationService.insertSearchIndex({
          tenant_id: tenant.id,
          entity_type: table,
          entity_id: (data as { id?: string })?.id ?? "",
          title: String(
            values.title ||
              values.name ||
              values.book_title ||
              values.room_number ||
              values.vehicle_number ||
              "New Record",
          ),
          subtitle: String(values.description || values.author || values.capacity || ""),
        });
        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: user?.id ?? null,
          entity_type: table,
          entity_id: (data as { id?: string })?.id ?? "",
          module: "resource",
          verb: "CREATED",
          summary: `Created new ${table} record`,
        });
      }
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

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: user?.id ?? null,
          action: "update",
          entity_type: table,
          entity_id: id,
          new_data: values,
        });
        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: user?.id ?? null,
          entity_type: table,
          entity_id: id,
          module: "resource",
          verb: "UPDATED",
          summary: `Updated ${table} record`,
        });
      }
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

      if (tenant?.id) {
        for (const id of ids) {
          await integrationService.insertAuditLog({
            tenant_id: tenant.id,
            actor_id: user?.id ?? null,
            action: "delete",
            entity_type: table,
            entity_id: id,
          });
        }
      }
    },
    onSuccess: (_data, ids) => {
      toast.success(ids.length > 1 ? `${ids.length} records removed` : "Record removed");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { create, update, remove };
}
