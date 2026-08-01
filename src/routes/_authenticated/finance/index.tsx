import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CreditCard, FileText, TrendingUp, Receipt, AlertCircle } from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoices, usePayments } from "@/hooks/useFinance";

export const Route = createFileRoute("/_authenticated/finance/")({
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data: invoices } = useInvoices();
  const { data: payments } = usePayments();

  // Basic aggregations
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  const totalCollected =
    payments?.filter((p) => p.status === "successful").reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalPending = invoices?.reduce((sum, inv) => sum + inv.balance_amount, 0) || 0;

  const overdueCount = invoices?.filter((inv) => inv.status === "overdue").length || 0;

  const recentPayments = payments?.slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Finance Dashboard"
        description="Overview of collections, dues, and financial health."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoiced"
          value={`$${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12, label: "from last month", isPositive: true }}
        />
        <StatCard
          title="Total Collected"
          value={`$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<Banknote className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, label: "from last month", isPositive: true }}
        />
        <StatCard
          title="Pending Dues"
          value={`$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Overdue Invoices"
          value={overdueCount}
          icon={<AlertCircle className="h-4 w-4 text-destructive" />}
          trend={{ value: 2, label: "new overdue", isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Collection trends over the current academic year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
              [Chart: Revenue over time]
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest successful transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{payment.receipt_number}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.payment_date).toLocaleDateString()} •{" "}
                        {payment.payment_mode}
                      </p>
                    </div>
                  </div>
                  <div className="font-medium">
                    +${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent payments.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
