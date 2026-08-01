import { useState } from "react";
import { Calculator, Plus } from "lucide-react";
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
import { useCreateBudget } from "@/hooks/finance/useBudgets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BudgetPlanner() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createBudget, isPending } = useCreateBudget();

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: "",
      type: "department" as const,
      total_amount: 0,
      start_date: "",
      end_date: "",
      academic_year_id: "",
    },
  });

  const onSubmit = async (data: {
    name: string;
    type: "annual" | "department" | "program" | "project";
    total_amount: number;
    start_date: string;
    end_date: string;
    academic_year_id: string;
  }) => {
    try {
      await createBudget(data);
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Plan New Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Budget Planner</DialogTitle>
          <DialogDescription>
            Create a new budget envelope for a department or program.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              placeholder="e.g. Science Dept 2026-27"
              {...register("name")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Budget Type</Label>
            <Select
              onValueChange={(val: "annual" | "department" | "program" | "project") =>
                setValue("type", val)
              }
              defaultValue="department"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Corporate</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="program">Program specific</SelectItem>
                <SelectItem value="project">Project specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Envelope Amount ($)</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              {...register("total_amount", { valueAsNumber: true })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...register("start_date")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" {...register("end_date")} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Create Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
