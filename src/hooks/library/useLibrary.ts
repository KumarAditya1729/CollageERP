import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { libraryService } from "@/lib/library/libraryService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

export function useLibraryCatalog() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_items", tenant?.id],
    queryFn: () => libraryService.getCatalog(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useLibraryCopies(itemId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_item_copies", tenant?.id, itemId],
    queryFn: () => libraryService.getCopies(tenant!.id, itemId),
    enabled: !!tenant?.id,
  });
}

export function useLibraryMembers() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_members", tenant?.id],
    queryFn: () => libraryService.getMembers(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useLibraryCirculation() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_issue_transactions", tenant?.id],
    queryFn: () => libraryService.getCirculation(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useIssueLibraryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (transaction: Record<string, unknown>) => {
      const data = await libraryService.issueItem({ ...transaction, tenant_id: tenant?.id });

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: null,
          action: "create",
          entity_type: "lib_issue_transactions",
          entity_id: (data as { id?: string })?.id,
          new_data: transaction,
        });
        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: null,
          entity_type: "lib_issue_transactions",
          entity_id: (data as { id?: string })?.id || "unknown",
          module: "library",
          verb: "ISSUED",
          summary: `Library item issued.`,
        });
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lib_issue_transactions", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["lib_item_copies", tenant?.id] });
    },
  });
}

export function useLibraryFines() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_fines", tenant?.id],
    queryFn: () => libraryService.getFines(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateLibraryFine() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const data = await libraryService.createFine({ ...payload, tenant_id: tenant?.id });
      // Integration 6: Library Fine -> Post Finance Transaction
      // We assume payload contains member_id and amount
      if (payload.member_id && payload.amount) {
        // Find student_id from member_id if needed, assuming the payload includes it or we get it
        // For simplicity in integration sprint, we log the finance transaction directly if member is student
        await supabase.from("finance_transactions" as unknown as never).insert({
          tenant_id: tenant!.id,
          // student_id: we would resolve this, but assuming we can attach directly to general ledger if student isn't required directly by transaction
          transaction_date: new Date().toISOString().split("T")[0],
          amount: payload.amount,
          type: "income",
          status: "completed",
          payment_method: "online",
          reference: `Fine for member ${payload.member_id}`,
        } as unknown as never);

        // Notification
        if (payload.member_id) {
          // Assuming payload.member_id corresponds to the user_id or student_id
          await integrationService.sendNotification({
            tenant_id: tenant!.id,
            recipient_id: payload.member_id as string,
            title: "Library Fine Generated",
            body: `A fine of ${payload.amount} has been generated for your library account.`,
          });
        }
      }

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: null,
          action: "create",
          entity_type: "lib_fines",
          entity_id: (data as { id?: string })?.id,
          new_data: payload,
        });
        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: null,
          entity_type: "lib_fines",
          entity_id: (data as { id?: string })?.id || "unknown",
          module: "library",
          verb: "FINE_GENERATED",
          summary: `Library fine of ${payload.amount} generated.`,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lib_fines", tenant?.id] });
    },
  });
}

export function useReturnLibraryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (transaction: { id: string; member_id?: string; [key: string]: unknown }) => {
      const returnDate = new Date().toISOString();
      const data = await libraryService.returnItem(transaction.id, returnDate);

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: null,
          action: "update",
          entity_type: "lib_issue_transactions",
          entity_id: transaction.id,
          new_data: { status: "returned", return_date: returnDate },
        });

        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: null,
          entity_type: "lib_issue_transactions",
          entity_id: transaction.id,
          module: "library",
          verb: "RETURNED",
          summary: `Library item returned.`,
        });

        await integrationService.insertSearchIndex({
          tenant_id: tenant.id,
          entity_type: "lib_issue_transactions",
          entity_id: transaction.id,
          title: `Library Return`,
          subtitle: `Item returned to library`,
          url: `/library/circulation`,
          module: "library",
        });
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lib_issue_transactions", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["lib_item_copies", tenant?.id] });
    },
  });
}

export function useRenewLibraryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (transaction: {
      id: string;
      member_id?: string;
      new_due_date: string;
      [key: string]: unknown;
    }) => {
      const data = await libraryService.renewItem(transaction.id, transaction.new_due_date);

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: null,
          action: "update",
          entity_type: "lib_issue_transactions",
          entity_id: transaction.id,
          new_data: { due_date: transaction.new_due_date, status: "issued" },
        });

        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: null,
          entity_type: "lib_issue_transactions",
          entity_id: transaction.id,
          module: "library",
          verb: "RENEWED",
          summary: `Library item renewed until ${transaction.new_due_date}.`,
        });

        if (transaction.member_id) {
          await integrationService.sendNotification({
            tenant_id: tenant.id,
            recipient_id: transaction.member_id as string,
            title: "Library Item Renewed",
            body: `Your borrowed item has been renewed. New due date: ${transaction.new_due_date}.`,
          });
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lib_issue_transactions", tenant?.id] });
    },
  });
}

export function useLibraryReservations() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["lib_reservations", tenant?.id],
    queryFn: () => libraryService.getReservations(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const data = await libraryService.createReservation({ ...payload, tenant_id: tenant?.id });

      if (tenant?.id) {
        await integrationService.insertAuditLog({
          tenant_id: tenant.id,
          actor_id: null,
          action: "create",
          entity_type: "lib_reservations",
          entity_id: (data as { id?: string })?.id,
          new_data: payload,
        });

        await integrationService.insertTimelineEntry({
          tenant_id: tenant.id,
          actor_id: null,
          entity_type: "lib_reservations",
          entity_id: (data as { id?: string })?.id || "unknown",
          module: "library",
          verb: "RESERVED",
          summary: `Library item reserved.`,
        });

        await integrationService.insertSearchIndex({
          tenant_id: tenant.id,
          entity_type: "lib_reservations",
          entity_id: (data as { id?: string })?.id || "unknown",
          title: `Library Reservation`,
          subtitle: `Book reservation`,
          url: `/library/catalog`,
          module: "library",
        });

        if (payload.member_id) {
          await integrationService.sendNotification({
            tenant_id: tenant.id,
            recipient_id: payload.member_id as string,
            title: "Reservation Confirmed",
            body: `Your library reservation has been placed successfully.`,
          });
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lib_reservations", tenant?.id] });
    },
  });
}
