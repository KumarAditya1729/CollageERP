import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRefunds } from "@/hooks/finance/useRefunds";
import { RefundProcessor } from "@/components/finance/RefundProcessor";


export const Route = createFileRoute("/_authenticated/finance/refunds")({
  component: RefundsPage,
});

function RefundsPage() {
  const { data: refunds, isLoading } = useRefunds();

  if (isLoading) return <div className="p-8">Loading refunds...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Engine</h1>
          <p className="text-muted-foreground">Manage student refunds and scholarship reversals</p>
        </div>
        <RefundProcessor />
      </div>

      <div className="space-y-4">
        {refunds?.map((refund) => (
          <Card key={refund.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Student: {refund.student_id.split("-")[0]}
                  </CardTitle>
                  <CardDescription>Reason: {refund.reason}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{(`₹${Number(refund.amount).toLocaleString('en-IN')}`)}</span>
                  <Badge
                    variant={
                      refund.status === "approved"
                        ? "default"
                        : refund.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {refund.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
        {refunds?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No active refund requests.
          </div>
        )}
      </div>
    </div>
  );
}
