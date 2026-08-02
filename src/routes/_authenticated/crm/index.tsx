import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { LeadKanban } from "@/components/crm/LeadKanban";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { FollowupModal } from "@/components/crm/FollowupModal";
import { useCRMLeads } from "@/hooks/useCRM";
import { useAccess } from "@/hooks/useAccess";
import { CRMLead } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/crm/")({
  head: () => ({
    meta: [
      { title: "Admissions CRM — CampusOS" },
      { name: "description", content: "Manage leads, enquiries, and admission follow-ups." },
    ],
  }),
  component: CRMPage,
  errorComponent: ({ error }) => <ErrorState title="Could not load CRM" description={error.message} />,
});

function CRMPage() {
  const { can } = useAccess();
  const canManage = can("student.manage");
  
  const [createOpen, setCreateOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<CRMLead | null>(null);
  const [followupOpen, setFollowupOpen] = useState(false);

  const { data: leads = [], isLoading, error, refetch } = useCRMLeads();

  const handleLogFollowup = (lead: CRMLead) => {
    setActiveLead(lead);
    setFollowupOpen(true);
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load leads"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Admissions CRM"
        description="Track and manage prospective student enquiries and admission leads."
        crumbs={[{ label: "Admissions" }, { label: "CRM" }]}
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              New Lead
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <InlineLoader label="Loading leads..." />
      ) : (
        <div className="flex-1 overflow-hidden h-[calc(100vh-12rem)] min-h-[500px]">
          <LeadKanban 
            leads={leads} 
            onLogFollowup={handleLogFollowup} 
            canManage={canManage} 
          />
        </div>
      )}

      {createOpen && (
        <LeadFormDialog 
          open={createOpen} 
          onOpenChange={setCreateOpen} 
        />
      )}

      {followupOpen && (
        <FollowupModal 
          open={followupOpen} 
          onOpenChange={(open) => {
            setFollowupOpen(open);
            if (!open) setActiveLead(null);
          }} 
          lead={activeLead} 
        />
      )}
    </>
  );
}
