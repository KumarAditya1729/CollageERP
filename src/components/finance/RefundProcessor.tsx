import { useState } from "react";
import { Undo2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRefund } from "@/hooks/finance/useRefunds";

export function RefundProcessor() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createRefund, isPending } = useCreateRefund();
  const { register, handleSubmit } = useForm<{
    student_id: string;
    amount: number;
    reason: string;
  }>();

  const onSubmit = async (data: { student_id: string; amount: number; reason: string }) => {
    try {
      await createRefund({
        student_id: data.student_id,
        amount: data.amount,
        reason: data.reason,
      });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Undo2 className="mr-2 h-4 w-4" />
          Process Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>Initiate a refund workflow for a student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              placeholder="Student Roll No..."
              {...register("student_id")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Refund Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Input
              id="reason"
              placeholder="e.g. Overpayment, Withdrawal"
              {...register("reason")}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} variant="destructive">
              Submit for Approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
