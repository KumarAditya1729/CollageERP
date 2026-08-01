import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSubmitSelfReview } from "@/hooks/hrms/usePerformance";

interface AppraisalFormProps {
  appraisalId: string;
  mode: "self" | "manager";
  trigger?: React.ReactNode;
}

interface ReviewFormValues {
  notes: string;
}

export function AppraisalForm({ appraisalId, mode, trigger }: AppraisalFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const { mutateAsync: submitSelfReview, isPending } = useSubmitSelfReview();
  const { register, handleSubmit } = useForm<ReviewFormValues>({
    defaultValues: { notes: "" },
  });

  const onSubmit = async (data: ReviewFormValues) => {
    if (mode === "self") {
      await submitSelfReview({
        id: appraisalId,
        self_rating: rating,
        self_review_notes: data.notes,
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {mode === "self" ? "Submit Self Review" : "Submit Manager Review"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === "self" ? "Self Appraisal" : "Manager Appraisal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>
              Overall Rating: <span className="text-primary font-bold text-lg">{rating}/5</span>
            </Label>
            <Slider
              min={1}
              max={5}
              step={0.5}
              value={[rating]}
              onValueChange={([v]) => setRating(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Needs Improvement</span>
              <span>Outstanding</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Review Notes</Label>
            <Input
              id="notes"
              placeholder="Summarize performance, achievements, and areas of improvement..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
