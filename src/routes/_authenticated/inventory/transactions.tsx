import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Can } from "@/components/common/can";
import { useInventoryMovements } from "@/hooks/inventory/useInventory";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/inventory/transactions")({
  component: InventoryTransactions,
});

type Movement = Record<string, unknown>;

function InventoryTransactions() {
  const txns = useInventoryMovements();

  const columns: DataTableColumn<Movement>[] = [
    {
      key: "transaction_date",
      header: "Date",
      value: (r) => String(r.transaction_date ?? r.created_at ?? ""),
    },
    {
      key: "transaction_type",
      header: "Type",
      render: (r) => (
        <Badge
          variant={
            r.transaction_type === "issue" || r.movement_type === "out"
              ? "destructive"
              : "secondary"
          }
        >
          {String(r.transaction_type ?? r.movement_type ?? "—")}
        </Badge>
      ),
    },
    { key: "item_id", header: "Item ID", value: (r) => String(r.item_id ?? "") },
    { key: "quantity", header: "Quantity", value: (r) => Number(r.quantity ?? 0) },
    {
      key: "reference_type",
      header: "Reference",
      value: (r) => String(r.reference_type ?? r.notes ?? ""),
    },
  ];

  return (
    <Can
      permission="inventory.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Inventory Movements"
          description="All stock movements — issues, receipts, and adjustments."
        />
        <DataTable
          columns={columns}
          rows={txns.data ?? []}
          getRowId={(r) => String(r.id ?? Math.random())}
          loading={txns.isLoading}
        />
      </div>
    </Can>
  );
}
