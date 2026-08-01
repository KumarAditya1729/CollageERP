/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { RecordFormDialog, FieldDef, RecordValues } from "@/components/common/record-form-dialog";
import { useHostelBeds } from "@/hooks/hostel/useHostel";

interface RoomTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecordValues) => Promise<void>;
  allocationId: string;
  fromBedId: string;
}

export function RoomTransferDialog({
  open,
  onOpenChange,
  onSubmit,
  allocationId,
  fromBedId,
}: RoomTransferDialogProps) {
  const { data: beds } = useHostelBeds();

  const availableBeds = useMemo(() => {
    if (!beds) return [];
    // Only show unoccupied beds
    return beds
      .filter((b: any) => !b.is_occupied)
      .map((b: any) => ({
        value: b.id,
        label: `${b.hos_rooms?.hos_floors?.hos_hostels?.name} - Room ${b.hos_rooms?.room_number} - Bed ${b.bed_number}`,
      }));
  }, [beds]);

  const fields: FieldDef[] = [
    {
      name: "allocation_id",
      label: "Allocation ID",
      type: "text",
      required: true,
      full: true,
    },
    {
      name: "from_bed_id",
      label: "Current Bed ID",
      type: "text",
      required: true,
      full: true,
    },
    {
      name: "to_bed_id",
      label: "New Bed",
      type: "select",
      required: true,
      options: availableBeds,
      full: true,
    },
    {
      name: "transfer_date",
      label: "Transfer Date",
      type: "date",
      required: true,
    },
    {
      name: "reason",
      label: "Reason for Transfer",
      type: "textarea",
      required: true,
      full: true,
    },
  ];

  // Provide initial values invisibly or disable them in a real app,
  // but RecordFormDialog doesn't support hidden/disabled fields currently.
  // We'll rely on the backend/service ignoring them if needed, or pass them in initialValues.
  const initialValues = {
    allocation_id: allocationId,
    from_bed_id: fromBedId,
    transfer_date: new Date().toISOString().split("T")[0],
  };

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer Room/Bed"
      fields={fields}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel="Transfer"
    />
  );
}
