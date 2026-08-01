import { useState } from "react";
import { Laptop } from "lucide-react";
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

export function AssetManager() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: {
    name: string;
    asset_code: string;
    category: string;
    purchase_cost: number;
    purchase_date: string;
  }) => {
    console.log("Adding asset...", data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Laptop className="mr-2 h-4 w-4" />
          Add Fixed Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Fixed Asset</DialogTitle>
          <DialogDescription>
            Register a new asset for depreciation and maintenance tracking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input id="name" placeholder="e.g. Dell XPS 15" {...register("name")} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_code">Asset Code</Label>
              <Input id="asset_code" placeholder="IT-LT-001" {...register("asset_code")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="IT Equipment" {...register("category")} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_cost">Purchase Cost ($)</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.01"
                {...register("purchase_cost", { valueAsNumber: true })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input id="purchase_date" type="date" {...register("purchase_date")} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
