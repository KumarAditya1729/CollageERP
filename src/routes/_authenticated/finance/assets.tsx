import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAssets } from "@/hooks/finance/useAssets";
import { AssetManager } from "@/components/finance/AssetManager";

export const Route = createFileRoute("/_authenticated/finance/assets")({
  component: AssetsPage,
});

function AssetsPage() {
  const { data: assets, isLoading } = useAssets();

  if (isLoading) return <div className="p-8">Loading assets...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixed Assets</h1>
          <p className="text-muted-foreground">Asset register, depreciation, and maintenance</p>
        </div>
        <AssetManager />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets?.map((asset) => (
          <Card key={asset.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{asset.name}</CardTitle>
                  <CardDescription>
                    {asset.asset_code} &bull; {asset.category}
                  </CardDescription>
                </div>
                <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                  {asset.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">{`₹${Number(asset.current_value).toLocaleString("en-IN")}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Purchased</p>
                  <p className="text-sm">{new Date(asset.purchase_date).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {assets?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No fixed assets registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
