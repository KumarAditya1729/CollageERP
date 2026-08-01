import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { useAccess } from "@/hooks/useAccess";
import {
  useLibraryCirculation,
  useIssueLibraryItem,
  useReturnLibraryItem,
  useRenewLibraryItem,
} from "@/hooks/library/useLibrary";
import { IssuanceCard } from "@/components/library/IssuanceCard";
import { IssueDialog } from "@/components/library/IssueDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CirculationItem = {
  id?: string;
  status?: string;
  due_date?: string;
  issue_date?: string;
  lib_item_copies?: { accession_number?: string; lib_items?: { title?: string } };
  lib_members?: { users?: { first_name?: string; last_name?: string } };
  [key: string]: unknown;
};

export const Route = createFileRoute("/_authenticated/library/circulation")({
  component: LibraryCirculation,
});

function LibraryCirculation() {
  const { can } = useAccess();
  const circulation = useLibraryCirculation();
  const issueMutation = useIssueLibraryItem();
  const returnMutation = useReturnLibraryItem();
  const renewMutation = useRenewLibraryItem();

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);

  if (!can("library.manage")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to manage circulation.</p>
      </div>
    );
  }

  const activeIssues =
    circulation.data?.filter((c: CirculationItem) => c.status === "issued") || [];
  const returnedIssues =
    circulation.data?.filter((c: CirculationItem) => c.status === "returned") || [];

  const handleIssue = async (values: {
    member_id?: string;
    accession_number?: string;
    due_date?: string;
    [key: string]: unknown;
  }) => {
    try {
      // Find the user ID from member barcode (mock logic - ideally backend does this)
      // For now we assume member_id input is the actual lib_members.id or we lookup
      const { data: member } = await supabase
        .from("lib_members" as never)
        .select("id")
        .eq("member_number", values.member_id || "")
        .single();
      const { data: copy } = await supabase
        .from("lib_item_copies" as never)
        .select("id")
        .eq("accession_number", values.accession_number || "")
        .single();

      if (!member || !copy) {
        toast.error("Invalid member or accession number");
        return;
      }

      await issueMutation.mutateAsync({
        member_id: (member as Record<string, unknown>).id as string,
        copy_id: (copy as Record<string, unknown>).id as string,
        due_date: values.due_date || "",
        status: "issued",
      });

      toast.success("Book issued successfully");
      setIsIssueDialogOpen(false);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to issue book");
    }
  };

  const handleReturn = async (transaction: CirculationItem) => {
    try {
      await returnMutation.mutateAsync({
        id: transaction.id || "",
        member_id: (transaction.lib_members as Record<string, unknown> | undefined)?.id as
          string | undefined,
      });
      toast.success("Book returned successfully");
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleRenew = async (transaction: CirculationItem) => {
    try {
      // Extend due date by 14 days from today
      const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      await renewMutation.mutateAsync({
        id: transaction.id || "",
        new_due_date: newDueDate,
        member_id: (transaction.lib_members as Record<string, unknown> | undefined)?.id as
          string | undefined,
      });
      toast.success(`Book renewed. New due date: ${newDueDate}`);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Circulation Desk" description="Manage issues, returns, and renewals." />
        <Button onClick={() => setIsIssueDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Issue Book
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Active Circulations ({activeIssues.length})
          </h3>
          {circulation.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : activeIssues.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active circulations.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeIssues.map((transaction: CirculationItem) => (
                <IssuanceCard
                  key={transaction.id}
                  transaction={transaction}
                  onRenew={handleRenew}
                  onReturn={handleReturn}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <IssueDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        onSubmit={handleIssue}
        isSubmitting={issueMutation.isPending}
      />
    </div>
  );
}
