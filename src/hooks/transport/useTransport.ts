import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { transportService } from "@/lib/transport/transportService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

// Helpers to reduce boilerplate
function useTransportQuery<T = unknown>(
  key: string,
  fetchFn: (tenantId: string) => Promise<T>,
  enabled: boolean,
) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: [key, tenant?.id],
    queryFn: () => fetchFn(tenant!.id),
    enabled: enabled && !!tenant?.id,
  });
}

function useTransportMutation<TArgs = Record<string, unknown>>(
  mutationFn: (payload: TArgs) => Promise<unknown>,
  queryKey: string,
  table?: string,
  action?: string,
) {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: TArgs) => {
      const result = await mutationFn({ ...payload, tenant_id: tenant?.id } as TArgs);
      if (tenant?.id && table && action) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: user?.id ?? null,
          action: action as "create" | "update" | "delete",
          entity_type: table,
          entity_id: (result as { id?: string })?.id ?? (payload as { id?: string })?.id ?? "",
          new_data: payload as Record<string, unknown>,
        });

        // Search Index for Transport entities
        if (
          action === "create" &&
          [
            "transport_vehicles",
            "transport_routes",
            "transport_stops",
            "transport_drivers",
          ].includes(table)
        ) {
          await integrationService.insertSearchIndex({
            tenant_id: tenant.id,
            entity_type: table,
            entity_id: (result as { id?: string })?.id ?? "",
            title: String(
              (payload as Record<string, unknown>).name ||
                (payload as Record<string, unknown>).vehicle_number ||
                (payload as Record<string, unknown>).route_name ||
                "Transport Record",
            ),
          });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey, tenant?.id] });
    },
  });
}

// Vehicles
export function useTransportVehicles() {
  return useTransportQuery("trn_vehicles", transportService.getVehicles, true);
}
export function useCreateTransportVehicle() {
  return useTransportMutation(
    transportService.createVehicle,
    "trn_vehicles",
    "transport_vehicles",
    "create",
  );
}
export function useUpdateTransportVehicle() {
  return useTransportMutation(
    transportService.updateVehicle,
    "trn_vehicles",
    "transport_vehicles",
    "update",
  );
}
export function useDeleteTransportVehicle() {
  return useTransportMutation(
    transportService.deleteVehicle,
    "trn_vehicles",
    "transport_vehicles",
    "delete",
  );
}

// Drivers
export function useTransportDrivers() {
  return useTransportQuery("trn_drivers", transportService.getDrivers, true);
}
export function useCreateTransportDriver() {
  return useTransportMutation(
    transportService.createDriver,
    "trn_drivers",
    "transport_drivers",
    "create",
  );
}
export function useUpdateTransportDriver() {
  return useTransportMutation(
    transportService.updateDriver,
    "trn_drivers",
    "transport_drivers",
    "update",
  );
}
export function useDeleteTransportDriver() {
  return useTransportMutation(
    transportService.deleteDriver,
    "trn_drivers",
    "transport_drivers",
    "delete",
  );
}

// Attendants
export function useTransportAttendants() {
  return useTransportQuery("trn_attendants", transportService.getAttendants, true);
}
export function useCreateTransportAttendant() {
  return useTransportMutation(
    transportService.createAttendant,
    "trn_attendants",
    "transport_attendants",
    "create",
  );
}
export function useUpdateTransportAttendant() {
  return useTransportMutation(
    transportService.updateAttendant,
    "trn_attendants",
    "transport_attendants",
    "update",
  );
}
export function useDeleteTransportAttendant() {
  return useTransportMutation(
    transportService.deleteAttendant,
    "trn_attendants",
    "transport_attendants",
    "delete",
  );
}

// Routes
export function useTransportRoutes() {
  return useTransportQuery("trn_routes", transportService.getRoutes, true);
}
export function useCreateTransportRoute() {
  return useTransportMutation(
    transportService.createRoute,
    "trn_routes",
    "transport_routes",
    "create",
  );
}
export function useUpdateTransportRoute() {
  return useTransportMutation(
    transportService.updateRoute,
    "trn_routes",
    "transport_routes",
    "update",
  );
}
export function useDeleteTransportRoute() {
  return useTransportMutation(
    transportService.deleteRoute,
    "trn_routes",
    "transport_routes",
    "delete",
  );
}

// Stops
export function useTransportStops(routeId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["trn_stops", tenant?.id, routeId],
    queryFn: () => transportService.getStops(tenant!.id, routeId),
    enabled: !!tenant?.id,
  });
}
export function useCreateTransportStop() {
  return useTransportMutation(transportService.createStop, "trn_stops");
}
export function useUpdateTransportStop() {
  return useTransportMutation(transportService.updateStop, "trn_stops");
}
export function useDeleteTransportStop() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: transportService.deleteStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trn_stops", tenant?.id] });
    },
  });
}

// Student Allocations
export function useTransportStudentAllocations() {
  return useTransportQuery("trn_student_allocations", transportService.getStudentAllocations, true);
}
export function useCreateTransportStudentAllocation() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const data = await transportService.createStudentAllocation({
        ...payload,
        tenant_id: tenant?.id,
      });
      // Integration 5: Transport Allocation -> Generate Finance Invoice
      await supabase.from("finance_invoices" as unknown as never).insert({
        tenant_id: tenant!.id,
        student_id: payload.student_id,
        invoice_number: `INV-TRN-${Date.now()}`,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "draft",
        total_amount: 3000, // Typical fee for transport (mock value for integration)
        balance_amount: 3000,
        subtotal: 3000,
      } as unknown as never);
      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: null,
        action: "create",
        entity_type: "trn_student_allocations",
        entity_id: (data as { id: string }).id,
        new_data: payload,
      });

      if (payload.status === "approved" && payload.student_id) {
        await integrationService.sendNotification({
          tenant_id: tenant!.id,
          recipient_id: payload.student_id as string,
          title: "Transport Allocation Approved",
          body: "Your transport allocation has been approved.",
        });
      }

      await integrationService.insertTimelineEntry({
        tenant_id: tenant!.id,
        actor_id: null,
        entity_type: "trn_student_allocations",
        entity_id: (data as { id: string }).id,
        module: "transport",
        verb: "ALLOCATED",
        summary: `Transport allocated.`,
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenant!.id,
        entity_type: "trn_student_allocations",
        entity_id: (data as { id: string }).id,
        title: `Transport Allocation`,
        subtitle: `Student transport route allocation`,
        url: `/transport/allocations`,
        module: "transport",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trn_student_allocations", tenant?.id] });
    },
  });
}
export function useUpdateTransportStudentAllocation() {
  const { tenant } = useAccess();
  return useTransportMutation(
    async (payload: Record<string, unknown>) => {
      const data = await transportService.updateStudentAllocation(
        payload as Record<string, unknown>,
      );
      if (payload.status === "approved" && (data as { student_id?: string })?.student_id) {
        await integrationService.sendNotification({
          tenant_id: tenant!.id,
          recipient_id: (data as { student_id?: string }).student_id as string,
          title: "Transport Allocation Approved",
          body: "Your transport allocation status has been approved.",
        });
      }
      return data;
    },
    "trn_student_allocations",
    "trn_student_allocations",
    "update",
  );
}
export function useDeleteTransportStudentAllocation() {
  return useTransportMutation(
    transportService.deleteStudentAllocation as (
      payload: Record<string, unknown>,
    ) => Promise<unknown>,
    "trn_student_allocations",
    "trn_student_allocations",
    "delete",
  );
}

// Faculty Allocations
export function useTransportFacultyAllocations() {
  return useTransportQuery("trn_faculty_allocations", transportService.getFacultyAllocations, true);
}
export function useCreateTransportFacultyAllocation() {
  return useTransportMutation(transportService.createFacultyAllocation, "trn_faculty_allocations");
}
export function useUpdateTransportFacultyAllocation() {
  return useTransportMutation(transportService.updateFacultyAllocation, "trn_faculty_allocations");
}
export function useDeleteTransportFacultyAllocation() {
  return useTransportMutation(transportService.deleteFacultyAllocation, "trn_faculty_allocations");
}

// Attendance
export function useTransportAttendance() {
  return useTransportQuery("trn_attendance", transportService.getAttendance, true);
}
export function useCreateTransportAttendance() {
  return useTransportMutation(transportService.createAttendance, "trn_attendance");
}
export function useUpdateTransportAttendance() {
  return useTransportMutation(transportService.updateAttendance, "trn_attendance");
}
export function useDeleteTransportAttendance() {
  return useTransportMutation(transportService.deleteAttendance, "trn_attendance");
}

// Maintenance
export function useTransportMaintenance() {
  return useTransportQuery("trn_maintenance", transportService.getMaintenance, true);
}
export function useCreateTransportMaintenance() {
  const { tenant } = useAccess();
  return useTransportMutation(async (payload: Record<string, unknown>) => {
    const data = await transportService.createMaintenance(payload);
    if (tenant?.id) {
      await integrationService.insertAuditLog({
        tenant_id: tenant.id,
        actor_id: null,
        action: "create",
        entity_type: "trn_maintenance",
        entity_id: (data as { id?: string })?.id,
        new_data: payload,
      });
      // We could send a notification to an admin or manager here.
      // We'll skip specific recipient notification unless it's a specific user, but audit log is tracked!
    }
    return data;
  }, "trn_maintenance");
}
export function useUpdateTransportMaintenance() {
  return useTransportMutation(
    transportService.updateMaintenance as (payload: Record<string, unknown>) => Promise<unknown>,
    "trn_maintenance",
    "trn_maintenance",
    "update",
  );
}
export function useDeleteTransportMaintenance() {
  return useTransportMutation(
    transportService.deleteMaintenance as (payload: Record<string, unknown>) => Promise<unknown>,
    "trn_maintenance",
    "trn_maintenance",
    "delete",
  );
}

// Fuel Logs
export function useTransportFuelLogs() {
  return useTransportQuery("trn_fuel_logs", transportService.getFuelLogs, true);
}
export function useCreateTransportFuelLog() {
  return useTransportMutation(transportService.createFuelLog, "trn_fuel_logs");
}
export function useUpdateTransportFuelLog() {
  return useTransportMutation(transportService.updateFuelLog, "trn_fuel_logs");
}
export function useDeleteTransportFuelLog() {
  return useTransportMutation(transportService.deleteFuelLog, "trn_fuel_logs");
}

// Documents
export function useTransportDocuments() {
  return useTransportQuery("trn_documents", transportService.getDocuments, true);
}
export function useCreateTransportDocument() {
  return useTransportMutation(transportService.createDocument, "trn_documents");
}
export function useUpdateTransportDocument() {
  return useTransportMutation(transportService.updateDocument, "trn_documents");
}
export function useDeleteTransportDocument() {
  return useTransportMutation(transportService.deleteDocument, "trn_documents");
}

// Incidents
export function useTransportIncidents() {
  return useTransportQuery("trn_incidents", transportService.getIncidents, true);
}
export function useCreateTransportIncident() {
  const { tenant } = useAccess();
  return useTransportMutation(async (payload: Record<string, unknown>) => {
    const data = await transportService.createIncident(payload);
    if (tenant?.id) {
      await integrationService.insertAuditLog({
        tenant_id: tenant.id,
        actor_id: null,
        action: "create",
        entity_type: "trn_incidents",
        entity_id: (data as { id?: string })?.id,
        new_data: payload,
      });
    }
    return data;
  }, "trn_incidents");
}
export function useUpdateTransportIncident() {
  return useTransportMutation(
    transportService.updateIncident as (payload: Record<string, unknown>) => Promise<unknown>,
    "trn_incidents",
    "trn_incidents",
    "update",
  );
}
export function useDeleteTransportIncident() {
  return useTransportMutation(
    transportService.deleteIncident as (payload: Record<string, unknown>) => Promise<unknown>,
    "trn_incidents",
    "trn_incidents",
    "delete",
  );
}
