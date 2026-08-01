import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transport/reports")({
  component: TransportReports,
});

function TransportReports() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze fuel consumption across the fleet over time.
            </p>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Cost Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of maintenance costs per vehicle.
            </p>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View student/faculty allocations vs vehicle capacities.
            </p>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
