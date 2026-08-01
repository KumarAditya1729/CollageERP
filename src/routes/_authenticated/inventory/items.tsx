import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Can } from "@/components/common/can";
import { useInventoryItems } from "@/hooks/inventory/useInventory";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/inventory/items")({
  component: InventoryItems,
});

type InventoryItem = Record<string, unknown>;

function InventoryItems() {
  const items = useInventoryItems();

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "name", header: "Item Name", value: (r) => String(r.name ?? "") },
    { key: "sku", header: "SKU", value: (r) => String(r.sku ?? "") },
    { key: "category", header: "Category", value: (r) => String(r.category ?? "") },
    { key: "quantity_on_hand", header: "In Stock", value: (r) => Number(r.quantity_on_hand ?? 0) },
    { key: "reorder_level", header: "Reorder At", value: (r) => Number(r.reorder_level ?? 0) },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const qty = Number(r.quantity_on_hand ?? 0);
        const reorder = Number(r.reorder_level ?? 0);
        const isLow = qty <= reorder;
        return (
          <Badge variant={isLow ? "destructive" : "secondary"}>{isLow ? "Low Stock" : "OK"}</Badge>
        );
      },
    },
  ];

  return (
    <Can
      permission="inventory.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Inventory Items"
          description="All inventory items and current stock levels."
        />
        <DataTable
          columns={columns}
          rows={items.data ?? []}
          getRowId={(r) => String(r.id ?? Math.random())}
          loading={items.isLoading}
        />
      </div>
    </Can>
  );
}
