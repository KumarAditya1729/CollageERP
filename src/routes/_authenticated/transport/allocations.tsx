/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportStudentAllocations,
  useCreateTransportStudentAllocation,
  useUpdateTransportStudentAllocation,
  useDeleteTransportStudentAllocation,
  useTransportRoutes,
  useTransportStops,
} from "@/hooks/transport/useTransport";
import { AllocationCard } from "@/components/transport/AllocationCard";
import { useStudentRegister } from "@/hooks/useStudents";

export const Route = createFileRoute("/_authenticated/transport/allocations")({
  component: TransportAllocations,
});

function TransportAllocations() {
  const { data, isLoading } = useTransportStudentAllocations();
  const { data: routes } = useTransportRoutes();
  const { data: stops } = useTransportStops();
  const { data: students } = useStudentRegister();

  const createMutation = useCreateTransportStudentAllocation();
  const updateMutation = useUpdateTransportStudentAllocation();
  const deleteMutation = useDeleteTransportStudentAllocation();

  return (
    <GridResourcePage
      title="Allocations"
      description="Manage student transport allocations"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => (
        <AllocationCard allocation={props.item} type="student" {...props} />
      )}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        student_id: {
          type: "select",
          label: "Student",
          required: true,
          options:
            students?.map((s: any) => ({ label: `${s.first_name} ${s.last_name}`, value: s.id })) ||
            [],
        },
        route_id: {
          type: "select",
          label: "Route",
          required: true,
          options: routes?.map((r: any) => ({ label: r.name, value: r.id })) || [],
        },
        pickup_stop_id: {
          type: "select",
          label: "Pickup Stop",
          options: stops?.map((s: any) => ({ label: s.name, value: s.id })) || [],
        },
        drop_stop_id: {
          type: "select",
          label: "Drop Stop",
          options: stops?.map((s: any) => ({ label: s.name, value: s.id })) || [],
        },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Active", value: "active" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
      }}
      searchPlaceholder="Search allocations..."
    />
  );
}
