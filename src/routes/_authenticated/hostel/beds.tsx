/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { BedCard } from "@/components/hostel/BedCard";
import {
  useHostelBeds,
  useCreateHostelBed,
  useUpdateHostelBed,
  useDeleteHostelBed,
  useHostelRooms,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/beds")({
  component: HostelBedsPage,
});

function HostelBedsPage() {
  const { data: beds, isLoading } = useHostelBeds();
  const { data: rooms } = useHostelRooms();

  const createBed = useCreateHostelBed();
  const updateBed = useUpdateHostelBed();
  const deleteBed = useDeleteHostelBed();

  const roomOptions = useMemo(() => {
    if (!rooms) return [];
    return rooms.map((r: any) => ({
      value: r.id,
      label: `${r.hos_floors?.hos_hostels?.name} - Room ${r.room_number}`,
    }));
  }, [rooms]);

  return (
    <GridResourcePage
      title="Hostel Beds"
      description="Manage individual beds across all rooms."
      items={beds || []}
      isLoading={isLoading}
      searchKeys={["bed_number", "hos_rooms.room_number", "hos_rooms.hos_floors.hos_hostels.name"]}
      renderItem={(item) => <BedCard item={item} />}
      onCreate={async (v) => {
        await createBed.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateBed.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteBed.mutateAsync({ id });
      }}
      fields={[
        {
          name: "room_id",
          label: "Room",
          type: "select",
          required: true,
          options: roomOptions,
          full: true,
        },
        {
          name: "bed_number",
          label: "Bed Number",
          type: "text",
          required: true,
        },
        {
          name: "is_occupied",
          label: "Is Occupied? (true/false)",
          type: "select",
          options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ],
        },
      ]}
    />
  );
}
