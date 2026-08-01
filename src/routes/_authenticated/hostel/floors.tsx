/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Layers } from "lucide-react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { Card, CardHeader } from "@/components/ui/card";
import {
  useHostelFloors,
  useCreateHostelFloor,
  useUpdateHostelFloor,
  useDeleteHostelFloor,
  useHostels,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/floors")({
  component: HostelFloorsPage,
});

function FloorCard({ item }: { item: any }) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-4 bg-muted/20 flex flex-row items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Floor {item.floor_number}</h3>
          <p className="text-xs text-muted-foreground">{item.hos_hostels?.name}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

function HostelFloorsPage() {
  const { data: floors, isLoading } = useHostelFloors();
  const { data: hostels } = useHostels();

  const createFloor = useCreateHostelFloor();
  const updateFloor = useUpdateHostelFloor();
  const deleteFloor = useDeleteHostelFloor();

  const hostelOptions = useMemo(() => {
    if (!hostels) return [];
    return hostels.map((h: any) => ({
      value: h.id,
      label: h.name,
    }));
  }, [hostels]);

  return (
    <GridResourcePage
      title="Hostel Floors"
      description="Manage floors within hostel buildings."
      items={floors || []}
      isLoading={isLoading}
      searchKeys={["floor_number", "hos_hostels.name"]}
      renderItem={(item) => <FloorCard item={item} />}
      onCreate={async (v) => {
        await createFloor.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateFloor.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteFloor.mutateAsync({ id });
      }}
      fields={[
        {
          name: "hostel_id",
          label: "Hostel",
          type: "select",
          required: true,
          options: hostelOptions,
          full: true,
        },
        {
          name: "floor_number",
          label: "Floor Number/Name",
          type: "text",
          required: true,
          full: true,
        },
      ]}
    />
  );
}
