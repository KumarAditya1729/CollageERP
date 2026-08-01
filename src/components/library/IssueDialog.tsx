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
import { BarcodeScanner } from "./BarcodeScanner";
import { addDays } from "date-fns";

const issueSchema = z.object({
  member_id: z.string().min(1, "Member ID is required"),
  accession_number: z.string().min(1, "Accession number is required"),
  due_date: z.string().min(1, "Due date is required"),
});

interface IssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof issueSchema>) => void;
  isSubmitting?: boolean;
}

export function IssueDialog({ open, onOpenChange, onSubmit, isSubmitting }: IssueDialogProps) {
  const form = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      member_id: "",
      accession_number: "",
      due_date: addDays(new Date(), 14).toISOString().slice(0, 16), // Default 14 days
    },
  });

  const handleSubmit = (values: z.infer<typeof issueSchema>) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>
            Scan member ID and book accession number to issue a physical copy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member ID (Barcode/RFID)</FormLabel>
                  <FormControl>
                    <BarcodeScanner
                      placeholder="Scan Member ID..."
                      onScan={(val) => form.setValue("member_id", val)}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accession_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Accession Number</FormLabel>
                  <FormControl>
                    <BarcodeScanner
                      placeholder="Scan Book Barcode..."
                      onScan={(val) => form.setValue("accession_number", val)}
                      autoFocus={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date & Time</FormLabel>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Issuing..." : "Process Issue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
