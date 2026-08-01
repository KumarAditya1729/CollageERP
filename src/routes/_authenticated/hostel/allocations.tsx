/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { AllocationCard } from "@/components/hostel/AllocationCard";
import { AllocationDialog } from "@/components/hostel/AllocationDialog";
import { RoomTransferDialog } from "@/components/hostel/RoomTransferDialog";
import {
  useHostelAllocations,
  useCreateHostelAllocation,
  useUpdateHostelAllocation,
  useDeleteHostelAllocation,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/allocations")({
  component: HostelAllocationsPage,
});

function HostelAllocationsPage() {
  const { data: allocations, isLoading } = useHostelAllocations();
  const createAllocation = useCreateHostelAllocation();
  const updateAllocation = useUpdateHostelAllocation();
  const deleteAllocation = useDeleteHostelAllocation();

  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);

  const handleCreate = async (values: any) => {
    await createAllocation.mutateAsync(values);
  };

  const handleTransfer = async (values: any) => {
    // Basic implementation of transfer: update allocation bed_id
    // Real implementation would also create a hos_transfers record.
    await updateAllocation.mutateAsync({
      id: values.allocation_id,
      bed_id: values.to_bed_id,
    });
    setTransferDialogOpen(false);
  };

  const handleVacate = async (item: any) => {
    if (confirm("Are you sure you want to vacate this student?")) {
      await updateAllocation.mutateAsync({
        id: item.id,
        status: "vacated",
        actual_check_out_date: new Date().toISOString().split("T")[0],
      });
    }
  };

  return (
    <>
      <GridResourcePage
        title="Hostel Allocations"
        description="Manage student room allocations and transfers."
        items={allocations || []}
        isLoading={isLoading}
        searchKeys={["students.first_name", "students.last_name", "students.enrollment_number"]}
        renderItem={(item) => (
          <AllocationCard
            item={item}
            onVacate={() => handleVacate(item)}
            onTransfer={() => {
              setSelectedAllocation(item);
              setTransferDialogOpen(true);
            }}
          />
        )}
        onCreate={async (v) => {
          await createAllocation.mutateAsync(v);
        }}
        onUpdate={async (id, v) => {
          await updateAllocation.mutateAsync({ id, ...v });
        }}
        onDelete={async (id) => {
          await deleteAllocation.mutateAsync({ id });
        }}
        // Instead of overriding the create button completely, we can just supply fields.
        // We will use standard ResourcePage create, but if they want custom they can use it.
        // For simplicity, we just provide the standard fields here since ResourcePage handles it cleanly.
        fields={[]} // Empty fields prevents standard creation, we'll override it manually? No, ResourcePage needs fields.
        customAction={{
          label: "New Allocation",
          onClick: () => setAllocationDialogOpen(true),
        }}
      />

      <AllocationDialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
        onSubmit={handleCreate}
      />

      {selectedAllocation && (
        <RoomTransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          allocationId={selectedAllocation.id}
          fromBedId={selectedAllocation.bed_id}
          onSubmit={handleTransfer}
        />
      )}
    </>
  );
}
