import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock } from "lucide-react";
import { useApprovePayrollRun } from "@/hooks/hrms/usePayroll";

import type { PayrollRunRow } from "@/hooks/hrms/usePayroll";

interface PayrollRunSummaryProps {
  run: PayrollRunRow;
  onViewPayslips?: () => void;
}

export function PayrollRunSummary({ run, onViewPayslips }: PayrollRunSummaryProps) {
  const { mutateAsync: approveRun, isPending } = useApprovePayrollRun();

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    draft: { label: "Draft", variant: "outline" },
    processing: { label: "Processing", variant: "secondary" },
    processed: { label: "Processed", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    paid: { label: "Paid", variant: "default" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };

  const config = statusConfig[run.status] ?? { label: run.status, variant: "secondary" };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{run.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(run.pay_period_start).toLocaleDateString()} –{" "}
              {new Date(run.pay_period_end).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Employees</p>
            <p className="text-2xl font-bold">{run.employee_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Gross</p>
            <p className="text-lg font-semibold">{`₹${run.total_gross.toLocaleString("en-IN")}`}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Net Pay</p>
            <p className="text-lg font-semibold text-primary">{`₹${run.total_net.toLocaleString("en-IN")}`}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Deductions</span>
            <span>{`₹${run.total_deductions.toLocaleString("en-IN")}`}</span>
          </div>
          <Progress
            value={run.total_gross > 0 ? (run.total_deductions / run.total_gross) * 100 : 0}
            className="h-2"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewPayslips}>
            <Clock className="mr-2 h-4 w-4" />
            View Payslips
          </Button>
          {run.status === "processed" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => approveRun(run.id)}
              disabled={isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Pay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
