import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { addDays } from "date-fns";

const reserveSchema = z.object({
  valid_until: z.string().min(1, "Valid until date is required"),
  notes: z.string().optional(),
});

interface ReservationDialogProps {
  item: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof reserveSchema>) => void;
  isSubmitting?: boolean;
}

export function ReservationDialog({
  item,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ReservationDialogProps) {
  const form = useForm<z.infer<typeof reserveSchema>>({
    resolver: zodResolver(reserveSchema),
    defaultValues: {
      valid_until: addDays(new Date(), 3).toISOString().slice(0, 16), // Valid for 3 days
      notes: "",
    },
  });

  if (!item) return null;

  const handleSubmit = (values: z.infer<typeof reserveSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reserve Book</DialogTitle>
          <DialogDescription>
            Place a reservation for{" "}
            <span className="font-semibold">{String(item.title || "")}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservation Valid Until</FormLabel>
                  <FormControl>
                    <input
                      type="datetime-local"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special requests..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Reserving..." : "Confirm Reservation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
