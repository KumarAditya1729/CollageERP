/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { RoomCard } from "@/components/hostel/RoomCard";
import {
  useHostelRooms,
  useCreateHostelRoom,
  useUpdateHostelRoom,
  useDeleteHostelRoom,
  useHostelFloors,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/rooms")({
  component: HostelRoomsPage,
});

function HostelRoomsPage() {
  const { data: rooms, isLoading } = useHostelRooms();
  const { data: floors } = useHostelFloors();

  const createRoom = useCreateHostelRoom();
  const updateRoom = useUpdateHostelRoom();
  const deleteRoom = useDeleteHostelRoom();

  const floorOptions = useMemo(() => {
    if (!floors) return [];
    return floors.map((f: any) => ({
      value: f.id,
      label: `${f.hos_hostels?.name} - Floor ${f.floor_number}`,
    }));
  }, [floors]);

  return (
    <GridResourcePage
      title="Hostel Rooms"
      description="Manage rooms across all hostels."
      items={rooms || []}
      isLoading={isLoading}
      searchKeys={["room_number", "room_type", "hos_floors.hos_hostels.name"]}
      renderItem={(item) => <RoomCard item={item} />}
      onCreate={async (v) => {
        await createRoom.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateRoom.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteRoom.mutateAsync({ id });
      }}
      fields={[
        {
          name: "floor_id",
          label: "Hostel Floor",
          type: "select",
          required: true,
          options: floorOptions,
          full: true,
        },
        {
          name: "room_number",
          label: "Room Number",
          type: "text",
          required: true,
        },
        {
          name: "room_type",
          label: "Room Type",
          type: "select",
          required: true,
          options: [
            { value: "single", label: "Single" },
            { value: "double", label: "Double" },
            { value: "triple", label: "Triple" },
            { value: "dormitory", label: "Dormitory" },
          ],
        },
        {
          name: "capacity",
          label: "Bed Capacity",
          type: "number",
          required: true,
        },
        {
          name: "has_ac",
          label: "Has AC? (true/false)",
          type: "select",
          options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ],
        },
        {
          name: "has_attached_bath",
          label: "Attached Bath? (true/false)",
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
