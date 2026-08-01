/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportStops,
  useCreateTransportStop,
  useUpdateTransportStop,
  useDeleteTransportStop,
  useTransportRoutes,
} from "@/hooks/transport/useTransport";
import { StopCard } from "@/components/transport/StopCard";

export const Route = createFileRoute("/_authenticated/transport/stops")({
  component: TransportStops,
});

function TransportStops() {
  const { data, isLoading } = useTransportStops();
  const { data: routes } = useTransportRoutes();
  const createMutation = useCreateTransportStop();
  const updateMutation = useUpdateTransportStop();
  const deleteMutation = useDeleteTransportStop();

  return (
    <GridResourcePage
      title="Stops"
      description="Manage route stops"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <StopCard stop={props.item} {...props} />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        route_id: {
          type: "select",
          label: "Route",
          required: true,
          options: routes?.map((r: any) => ({ label: r.name, value: r.id })) || [],
        },
        name: { type: "text", label: "Stop Name", required: true },
        stop_sequence: { type: "number", label: "Sequence", required: true },
        pickup_time: { type: "text", label: "Pickup Time" },
        drop_time: { type: "text", label: "Drop Time" },
      }}
      searchPlaceholder="Search stops..."
    />
  );
}
