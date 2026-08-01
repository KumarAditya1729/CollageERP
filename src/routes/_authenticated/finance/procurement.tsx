import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePurchaseRequests } from "@/hooks/finance/useProcurement";
import { PurchaseOrderBuilder } from "@/components/finance/PurchaseOrderBuilder";

export const Route = createFileRoute("/_authenticated/finance/procurement")({
  component: ProcurementPage,
});

function ProcurementPage() {
  const { data: requests, isLoading } = usePurchaseRequests();

  if (isLoading) return <div className="p-8">Loading procurement requests...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">Manage purchase requests and orders</p>
        </div>
        <PurchaseOrderBuilder />
      </div>

      <div className="space-y-4">
        {requests?.map((req) => (
          <Card key={req.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">PR-{req.id.split("-")[0]}</CardTitle>
                  <CardDescription>
                    Required by: {new Date(req.required_by_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    req.status === "approved"
                      ? "default"
                      : req.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {req.status?.replace("_", " ") ?? "-"}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
        {requests?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No purchase requests found.
          </div>
        )}
      </div>
    </div>
  );
}
