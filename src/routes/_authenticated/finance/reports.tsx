import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, PieChart, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/finance/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Finance Reports"
        description="Analytics, defaulter lists, and revenue insights."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Head-wise Collection</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Generated</div>
            <p className="text-xs text-muted-foreground">Analyze revenue by Fee Heads.</p>
            <Button variant="link" className="px-0 mt-2">
              View Report →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulters List</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120 Students</div>
            <p className="text-xs text-muted-foreground">With overdue invoices &gt; 30 days.</p>
            <Button variant="link" className="px-0 mt-2">
              View Report →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Analysis</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monthly</div>
            <p className="text-xs text-muted-foreground">Compare collections across terms.</p>
            <Button variant="link" className="px-0 mt-2">
              View Report →
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6">Finance Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,245,890.00</div>
              <p className="text-xs text-muted-foreground">+12.5% from last year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹45,231.00</div>
              <p className="text-xs text-muted-foreground">-4% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹845,120.00</div>
              <p className="text-xs text-muted-foreground">Budget Utilization: 68%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+₹400,770.00</div>
              <p className="text-xs text-muted-foreground">Positive operating flow</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Custom reports built from the financial ledger and billing engine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
            [Chart: Head-wise collection breakdown]
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
