import { useState } from "react";
import { FilePlus } from "lucide-react";
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
import { useCreatePurchaseRequest } from "@/hooks/finance/useProcurement";

export function PurchaseOrderBuilder() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createRequest, isPending } = useCreatePurchaseRequest();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      department_id: "",
      required_by_date: "",
      reason: "",
    },
  });

  const onSubmit = async (data: {
    department_id: string;
    required_by_date: string;
    reason: string;
  }) => {
    try {
      await createRequest({
        ...data,
        request_date: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" />
          Create PR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Purchase Request (PR)</DialogTitle>
          <DialogDescription>
            Initiate a procurement request for goods or services.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="department_id">Department ID</Label>
            <Input id="department_id" {...register("department_id")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="required_by_date">Required By</Label>
            <Input id="required_by_date" type="date" {...register("required_by_date")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Business Justification</Label>
            <Input
              id="reason"
              placeholder="Why is this purchase required?"
              {...register("reason")}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
