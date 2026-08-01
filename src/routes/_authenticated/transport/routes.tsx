/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportRoutes,
  useCreateTransportRoute,
  useUpdateTransportRoute,
  useDeleteTransportRoute,
  useTransportVehicles,
} from "@/hooks/transport/useTransport";
import { RouteCard } from "@/components/transport/RouteCard";

export const Route = createFileRoute("/_authenticated/transport/routes")({
  component: TransportRoutes,
});

function TransportRoutes() {
  const { data, isLoading } = useTransportRoutes();
  const { data: vehicles } = useTransportVehicles();
  const createMutation = useCreateTransportRoute();
  const updateMutation = useUpdateTransportRoute();
  const deleteMutation = useDeleteTransportRoute();

  return (
    <GridResourcePage
      title="Routes"
      description="Manage transport routes"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <RouteCard route={props.item} {...props} />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        name: { type: "text", label: "Route Name", required: true },
        start_location: { type: "text", label: "Start Location" },
        end_location: { type: "text", label: "End Location" },
        vehicle_id: {
          type: "select",
          label: "Vehicle",
          options: vehicles?.map((v: any) => ({ label: v.registration_number, value: v.id })) || [],
        },
      }}
      searchPlaceholder="Search routes..."
    />
  );
}
