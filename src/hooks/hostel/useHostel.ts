import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { hostelService } from "@/lib/hostel/hostelService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";
import { Database } from "@/integrations/supabase/types";

// Helper for generating mutations
function useHostelMutation<TArgs = unknown>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  queryKeys: string[][],
  table?: string,
  action?: string,
) {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: TArgs) => {
      const payload =
        typeof args === "object" && args !== null ? { ...args, tenant_id: tenant?.id } : args;
      const result = await mutationFn(payload as TArgs);

      if (tenant?.id && table && action) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: user?.id || null,
          action: action as "create" | "update" | "delete",
          entity_type: table,
          entity_id:
            (result as { id?: string })?.id ??
            (typeof args === "string" ? args : (args as { id?: string })?.id) ??
            "",
          new_data: typeof args === "object" ? (args as Record<string, unknown>) : { id: args },
        });

        if (action !== "delete") {
          await integrationService.insertSearchIndex({
            tenant_id: tenant.id,
            entity_type: table,
            entity_id:
              (result as { id?: string })?.id ??
              (typeof args === "string" ? args : (args as { id?: string })?.id) ??
              "",
            title: String(
              (args as Record<string, unknown>)?.name ||
                (args as Record<string, unknown>)?.room_number ||
                (args as Record<string, unknown>)?.bed_number ||
                "Hostel Record",
            ),
          });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
  });
}

// Hostels
export function useHostels() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_hostels", tenant?.id],
    queryFn: () => hostelService.getHostels(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostel() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createHostel({ ...payload, tenant_id: tenant?.id }),
    [["hos_hostels", tenant?.id as string]],
    "hos_hostels",
    "create",
  );
}

export function useUpdateHostel() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateHostel(payload),
    [["hos_hostels", tenant?.id as string]],
    "hos_hostels",
    "update",
  );
}

export function useDeleteHostel() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteHostel(payload.id),
    [["hos_hostels", tenant?.id as string]],
    "hos_hostels",
    "delete",
  );
}

// Floors
export function useHostelFloors() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_floors", tenant?.id],
    queryFn: () => hostelService.getFloors(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelFloor() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createFloor({ ...payload, tenant_id: tenant?.id }),
    [["hos_floors", tenant?.id as string]],
  );
}

export function useUpdateHostelFloor() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateFloor(payload),
    [["hos_floors", tenant?.id as string]],
  );
}

export function useDeleteHostelFloor() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteFloor(payload.id),
    [["hos_floors", tenant?.id as string]],
  );
}

// Rooms
export function useHostelRooms() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_rooms", tenant?.id],
    queryFn: () => hostelService.getRooms(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelRoom() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createRoom({ ...payload, tenant_id: tenant?.id }),
    [["hos_rooms", tenant?.id as string]],
    "hos_rooms",
    "create",
  );
}

export function useUpdateHostelRoom() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateRoom(payload),
    [["hos_rooms", tenant?.id as string]],
  );
}

export function useDeleteHostelRoom() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteRoom(payload.id),
    [["hos_rooms", tenant?.id as string]],
  );
}

// Beds
export function useHostelBeds() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_beds", tenant?.id],
    queryFn: () => hostelService.getBeds(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelBed() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createBed({ ...payload, tenant_id: tenant?.id }),
    [["hos_beds", tenant?.id as string]],
    "hos_beds",
    "create",
  );
}

export function useUpdateHostelBed() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateBed(payload),
    [["hos_beds", tenant?.id as string]],
    "hos_beds",
    "update",
  );
}

export function useDeleteHostelBed() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteBed(payload.id),
    [["hos_beds", tenant?.id as string]],
    "hos_beds",
    "delete",
  );
}

// Allocations
export function useHostelAllocations() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_allocations", tenant?.id],
    queryFn: () => hostelService.getAllocations(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelAllocation() {
  const { tenant } = useAccess();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const data = await hostelService.createAllocation({ ...payload, tenant_id: tenantId });

      const typedSupabase = supabase as unknown as {
        from: (table: string) => {
          insert: (data: Record<string, unknown>) => Promise<unknown>;
        };
      };

      const query = typedSupabase.from("finance_invoices").insert({
        tenant_id: tenantId as string,
        student_id: (payload as Record<string, unknown>).student_id as string,
        title: "Hostel Allocation Fee",
        amount: 5000,
        status: "pending",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_by: "system",
      });
      await query;

      await integrationService.insertAuditLog({
        tenant_id: tenantId!,
        actor_id: null,
        action: "create",
        entity_type: "hos_allocations",
        entity_id: data.id,
        new_data: payload,
      });

      if (payload.status === "approved" && payload.student_id) {
        await integrationService.sendNotification({
          tenant_id: tenantId!,
          recipient_id: payload.student_id as string,
          title: "Hostel Allocation Approved",
          body: `Your hostel allocation request has been approved.`,
        });
      }

      await integrationService.insertTimelineEntry({
        tenant_id: tenantId!,
        actor_id: null,
        entity_type: "hos_allocations",
        entity_id: data.id,
        module: "hostel",
        verb: "ALLOCATED",
        summary: `Hostel room allocated.`,
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenantId!,
        entity_type: "hos_allocations",
        entity_id: data.id,
        title: `Hostel Allocation`,
        subtitle: `Student allocation for hostel room`,
        url: `/hostel/allocations`,
        module: "hostel",
      });

      const workflowQuery = typedSupabase.from("workflow_instances").insert({
        tenant_id: tenantId as string,
        workflow_id: "system-hostel-allocation",
        entity_id: data.id,
        entity_type: "hos_allocations",
        status: "active",
        current_step_order: 1,
        started_by: "system",
      });
      await workflowQuery;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hos_allocations", tenant?.id as string] });
    },
  });
}

export function useUpdateHostelAllocation() {
  const { tenant } = useAccess();
  return useHostelMutation(
    async (payload: { id: string; [key: string]: unknown }) => {
      const data = await hostelService.updateAllocation(payload);
      if (payload.status === "approved" && data.student_id) {
        await integrationService.sendNotification({
          tenant_id: tenant!.id,
          recipient_id: data.student_id as string,
          title: "Hostel Allocation Updated",
          body: `Your hostel allocation status is now approved.`,
        });
      }
      return data;
    },
    [["hos_allocations", tenant?.id as string]],
    "hos_allocations",
    "update",
  );
}

export function useDeleteHostelAllocation() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteAllocation(payload.id),
    [["hos_allocations", tenant?.id as string]],
    "hos_allocations",
    "delete",
  );
}

// Waiting List
export function useHostelWaitingList() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_waiting_list", tenant?.id],
    queryFn: () => hostelService.getWaitingList(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelWaitingList() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createWaitingList({ ...payload, tenant_id: tenant?.id }),
    [["hos_waiting_list", tenant?.id as string]],
  );
}

export function useUpdateHostelWaitingList() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateWaitingList(payload),
    [["hos_waiting_list", tenant?.id as string]],
  );
}

export function useDeleteHostelWaitingList() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteWaitingList(payload.id),
    [["hos_waiting_list", tenant?.id as string]],
  );
}

// Mess Plans
export function useHostelMessPlans() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_mess_plans", tenant?.id],
    queryFn: () => hostelService.getMessPlans(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelMessPlan() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createMessPlan({ ...payload, tenant_id: tenant?.id }),
    [["hos_mess_plans", tenant?.id as string]],
  );
}

export function useUpdateHostelMessPlan() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateMessPlan(payload),
    [["hos_mess_plans", tenant?.id as string]],
  );
}

export function useDeleteHostelMessPlan() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteMessPlan(payload.id),
    [["hos_mess_plans", tenant?.id as string]],
  );
}

// Mess Enrollments
export function useHostelMessEnrollments() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_mess_enrollments", tenant?.id],
    queryFn: () => hostelService.getMessEnrollments(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelMessEnrollment() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createMessEnrollment({ ...payload, tenant_id: tenant?.id }),
    [["hos_mess_enrollments", tenant?.id as string]],
  );
}

export function useUpdateHostelMessEnrollment() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) =>
      hostelService.updateMessEnrollment(payload),
    [["hos_mess_enrollments", tenant?.id as string]],
  );
}

export function useDeleteHostelMessEnrollment() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteMessEnrollment(payload.id),
    [["hos_mess_enrollments", tenant?.id as string]],
  );
}

// Complaints
export function useHostelComplaints() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_complaints", tenant?.id],
    queryFn: () => hostelService.getComplaints(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelComplaint() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const data = await hostelService.createComplaint({ ...payload, tenant_id: tenant?.id });
      // Integration 7: Hostel Complaint -> Create Workflow Instance
      await supabase.from("workflow_instances").insert({
        tenant_id: tenant!.id,
        workflow_id: "hostel_complaint_resolution", // Assuming standard template ID string or we can query it
        entity_type: "hostel_complaint",
        entity_id: data.id,
        status: "pending",
        current_step_order: 1,
      });

      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: null,
        action: "create",
        entity_type: "hos_complaints",
        entity_id: data.id,
        new_data: payload,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hos_complaints", tenant?.id as string] });
    },
  });
}

export function useUpdateHostelComplaint() {
  const { tenant } = useAccess();
  return useHostelMutation(
    async (payload: { id: string; [key: string]: unknown }) => {
      const data = await hostelService.updateComplaint(payload);
      if (payload.status) {
        await integrationService.sendNotification({
          tenant_id: tenant!.id,
          recipient_id: data.student_id as string,
          title: "Hostel Complaint Updated",
          body: `Your complaint status is now ${payload.status}.`,
        });
      }
      return data;
    },
    [["hos_complaints", tenant?.id as string]],
    "hos_complaints",
    "update",
  );
}

export function useDeleteHostelComplaint() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteComplaint(payload.id),
    [["hos_complaints", tenant?.id as string]],
    "hos_complaints",
    "delete",
  );
}

// Gate Passes
export function useHostelGatePasses() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_gate_passes", tenant?.id],
    queryFn: () => hostelService.getGatePasses(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelGatePass() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createGatePass({ ...payload, tenant_id: tenant?.id }),
    [["hos_gate_passes", tenant?.id as string]],
  );
}

export function useUpdateHostelGatePass() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateGatePass(payload),
    [["hos_gate_passes", tenant?.id as string]],
  );
}

export function useDeleteHostelGatePass() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteGatePass(payload.id),
    [["hos_gate_passes", tenant?.id as string]],
  );
}

// Attendance
export function useHostelAttendance() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hos_attendance", tenant?.id],
    queryFn: () => hostelService.getAttendance(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateHostelAttendance() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: Record<string, unknown>) =>
      hostelService.createAttendance({ ...payload, tenant_id: tenant?.id }),
    [["hos_attendance", tenant?.id as string]],
  );
}

export function useUpdateHostelAttendance() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string; [key: string]: unknown }) => hostelService.updateAttendance(payload),
    [["hos_attendance", tenant?.id as string]],
  );
}

export function useDeleteHostelAttendance() {
  const { tenant } = useAccess();
  return useHostelMutation(
    (payload: { id: string }) => hostelService.deleteAttendance(payload.id),
    [["hos_attendance", tenant?.id as string]],
  );
}
