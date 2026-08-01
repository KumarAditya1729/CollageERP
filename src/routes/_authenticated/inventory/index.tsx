import { createFileRoute } from "@tanstack/react-router";
import { Package, TrendingDown, Layers, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Can } from "@/components/common/can";
import {
  useInventoryItems,
  useInventoryMovements,
  useInventoryStock,
} from "@/hooks/inventory/useInventory";

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: InventoryDashboard,
});

function InventoryDashboard() {
  const items = useInventoryItems();
  const movements = useInventoryMovements();
  const stock = useInventoryStock();

  const recentTxns = movements.data?.slice(0, 5) ?? [];

  return (
    <Can
      permission="inventory.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Inventory"
          description="Manage campus inventory, stock levels, and procurement."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Items" value={items.data?.length ?? 0} icon={Package} />
          <StatCard label="Stock Locations" value={stock.data?.length ?? 0} icon={Layers} />
          <StatCard
            label="Total Movements"
            value={movements.data?.length ?? 0}
            icon={TrendingDown}
          />
          <StatCard label="Categories" value="—" icon={BarChart3} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Recent Movements</h3>
          {recentTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent movements.</p>
          ) : (
            <div className="space-y-2">
              {recentTxns.map((t: Record<string, unknown>, i: number) => (
                <div
                  key={String(t.id ?? i)}
                  className="flex items-center justify-between border-b pb-2 text-sm"
                >
                  <span>
                    {String(t.movement_type ?? t.transaction_type ?? "—")} — Item:{" "}
                    {String(t.item_id ?? "—")}
                  </span>
                  <span className="text-muted-foreground">Qty: {String(t.quantity ?? "—")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Can>
  );
}
