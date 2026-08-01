import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";
import type { PayslipRow } from "@/hooks/hrms/usePayroll";


interface PayslipViewerProps {
  payslip: PayslipRow;
  trigger?: React.ReactNode;
}

export function PayslipViewer({ payslip, trigger }: PayslipViewerProps) {
  const earnings = payslip.earnings as Record<string, number>;
  const deductions = payslip.deductions as Record<string, number>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            View Payslip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{payslip.employee_name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{payslip.employee_code}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">
                {new Date(payslip.pay_period_start).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-muted/50 rounded p-3 text-center">
              <p className="text-muted-foreground text-xs">Working Days</p>
              <p className="text-2xl font-bold">{payslip.working_days}</p>
            </div>
            <div className="bg-muted/50 rounded p-3 text-center">
              <p className="text-muted-foreground text-xs">Days Present</p>
              <p className="text-2xl font-bold">{payslip.present_days}</p>
            </div>
            <div className="bg-muted/50 rounded p-3 text-center">
              <p className="text-muted-foreground text-xs">Leave Days</p>
              <p className="text-2xl font-bold">{payslip.leave_days}</p>
            </div>
          </div>

          <Separator />

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">Earnings</h3>
              <div className="space-y-1.5">
                {Object.entries(earnings).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium">{`₹${(value).toLocaleString("en-IN")}`}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Gross Salary</span>
                  <span className="text-green-600">{`₹${(payslip.gross_salary).toLocaleString("en-IN")}`}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-red-500 mb-2">Deductions</h3>
              <div className="space-y-1.5">
                {Object.entries(deductions).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium">{`₹${(value).toLocaleString("en-IN")}`}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Deductions</span>
                  <span className="text-red-500">{`₹${(payslip.total_deductions).toLocaleString("en-IN")}`}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center">
            <span className="text-lg font-semibold">Net Pay</span>
            <span className="text-3xl font-bold text-primary">
              {`₹${(payslip.net_salary).toLocaleString("en-IN")}`}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
