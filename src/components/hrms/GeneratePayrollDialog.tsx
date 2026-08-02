import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePayrollRun } from "@/hooks/hrms/usePayroll";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GeneratePayrollDialog({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePayrollDialogProps) {
  const { mutateAsync: generatePayroll, isPending } = useCreatePayrollRun();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workingDays, setWorkingDays] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !workingDays) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await generatePayroll({
        name,
        pay_period_start: startDate,
        pay_period_end: endDate,
        working_days: workingDays,
      });
      toast.success("Payroll run generated successfully");
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setName("");
      setStartDate("");
      setEndDate("");
      setWorkingDays(30);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate payroll");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate Payroll Run</DialogTitle>
            <DialogDescription>
              Calculate TDS, PF, and unpaid leaves for all active employees.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Run Name</Label>
              <Input
                id="name"
                placeholder="e.g. March 2024 Payroll"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Period Start</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Period End</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workingDays">Standard Working Days</Label>
              <Input
                id="workingDays"
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => setWorkingDays(parseInt(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate per-day salary for unpaid leaves deduction.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Calculator className="mr-2 h-4 w-4" />
              {isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
