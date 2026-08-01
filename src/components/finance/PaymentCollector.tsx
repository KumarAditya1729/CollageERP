import { useState } from "react";
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
import { useRecordPayment, useStudentInvoices } from "@/hooks/useFinance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banknote } from "lucide-react";

export function PaymentCollector() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: recordPayment, isPending } = useRecordPayment();

  const { register, handleSubmit, watch, setValue } = useForm<{
    studentId: string;
    amount: number;
    mode: "online" | "cash" | "bank_transfer" | "demand_draft" | "cheque";
    reference: string;
    invoiceId: string;
  }>({
    defaultValues: {
      studentId: "",
      amount: 0,
      mode: "online",
      reference: "",
      invoiceId: "",
    },
  });

  const studentId = watch("studentId");
  const { data: invoices } = useStudentInvoices(studentId.length > 5 ? studentId : undefined);

  const onSubmit = async (data: {
    studentId: string;
    amount: number;
    mode: "online" | "cash" | "bank_transfer" | "demand_draft" | "cheque";
    reference: string;
    invoiceId: string;
  }) => {
    try {
      await recordPayment({
        studentId: data.studentId,
        amount: data.amount,
        mode: data.mode,
        reference: data.reference,
        allocations: data.invoiceId ? [{ invoice_id: data.invoiceId, amount: data.amount }] : [],
      });
      setOpen(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Banknote className="mr-2 h-4 w-4" />
          Collect Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Record an incoming payment and allocate it to pending invoices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              placeholder="Enter student roll or ID..."
              {...register("studentId")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceId">Allocate to Invoice (Optional)</Label>
            <Select
              onValueChange={(val) => setValue("invoiceId", val)}
              disabled={!invoices || invoices.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pending invoice..." />
              </SelectTrigger>
              <SelectContent>
                {invoices
                  ?.filter((i) => i.balance_amount > 0)
                  .map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} (Due: ${inv.balance_amount.toLocaleString()})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Payment Mode</Label>
              <Select
                onValueChange={(
                  val: "online" | "cash" | "bank_transfer" | "demand_draft" | "cheque",
                ) => setValue("mode", val)}
                defaultValue="online"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online / Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="demand_draft">Demand Draft</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Txn ID</Label>
            <Input id="reference" placeholder="e.g. TXN123456789" {...register("reference")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
