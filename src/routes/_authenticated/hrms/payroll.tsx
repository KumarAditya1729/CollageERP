import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { usePayrollRuns, usePayslips } from "@/hooks/hrms/usePayroll";
import { PayrollRunSummary } from "@/components/hrms/PayrollRunSummary";
import { PayslipViewer } from "@/components/hrms/PayslipViewer";

export const Route = createFileRoute("/_authenticated/hrms/payroll")({
  component: PayrollPage,
});

function PayrollPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { data: runs, isLoading } = usePayrollRuns();
  const { data: payslips } = usePayslips(selectedRunId ?? "");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">
            Process monthly payroll, manage payslips and bank transfers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Payroll Run
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payroll Runs List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-lg">Payroll Runs</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            runs?.map((run) => (
              <div
                key={run.id}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${selectedRunId === run.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                onClick={() => setSelectedRunId(run.id)}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">{run.name}</p>
                  <Badge
                    variant={run.status === "paid" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {run.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(run.pay_period_start).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))
          )}
          {runs?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              No payroll runs yet.
            </p>
          )}
        </div>

        {/* Payroll Run Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRunId ? (
            <>
              {runs && (
                <PayrollRunSummary
                  run={runs.find((r) => r.id === selectedRunId)!}
                  onViewPayslips={() => {}}
                />
              )}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Payslips ({payslips?.length ?? 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payslips?.map((ps) => (
                      <div
                        key={ps.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium text-sm">{ps.employee_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {ps.employee_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold">
                            ₹{ps.net_salary.toLocaleString("en-IN")}
                          </span>
                          <PayslipViewer payslip={ps} />
                        </div>
                      </div>
                    ))}
                    {(payslips?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No payslips for this run yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground border border-dashed rounded-lg">
              Select a payroll run to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
