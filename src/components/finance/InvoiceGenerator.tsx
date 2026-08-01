import { useState } from "react";
import { Calculator, FileText } from "lucide-react";
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
import { useFeeStructures } from "@/hooks/useFinance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InvoiceGenerator() {
  const { data: structures } = useFeeStructures();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      studentId: "",
      structureId: "",
      discount: 0,
    },
  });

  const onSubmit = (data: { studentId: string; structureId: string; discount: number }) => {
    // Generate invoice logic would go here
    console.log("Generating invoice:", data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for a student based on a fee structure.
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
            <Label htmlFor="structureId">Fee Structure</Label>
            <Select
              onValueChange={(val) => register("structureId").onChange({ target: { value: val } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a fee structure" />
              </SelectTrigger>
              <SelectContent>
                {structures?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (${s.total_amount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Custom Discount ($)</Label>
            <Input id="discount" type="number" {...register("discount", { valueAsNumber: true })} />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Select a structure to calculate totals.</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate & Publish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
