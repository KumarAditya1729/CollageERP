import { createFileRoute } from "@tanstack/react-router";
import { Send, FileText } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { CommunicationList } from "@/components/communications/CommunicationList";
import { CommunicationComposer } from "@/components/communications/CommunicationComposer";
import { useCommunications } from "@/hooks/useCommunications";
import { useAccess } from "@/hooks/useAccess";
import { Communication } from "@/lib/communications";

export const Route = createFileRoute("/_authenticated/communications/")({
  head: () => ({
    meta: [
      { title: "Communication Center — CampusOS" },
      { name: "description", content: "Send and manage mass communications, circulars, and notices." },
    ],
  }),
  component: CommunicationsPage,
  errorComponent: ({ error }) => <ErrorState title="Could not load communications" description={error.message} />,
});

function CommunicationsPage() {
  const { can } = useAccess();
  // We'll map this to an existing permission, maybe just system default for now
  const canManage = true; // Replace with proper permission check if needed
  
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeComm, setActiveComm] = useState<Communication | null>(null);

  const { data: communications = [], isLoading, error, refetch } = useCommunications();

  const handleEdit = (comm: Communication) => {
    setActiveComm(comm);
    setComposerOpen(true);
  };

  const handleCreate = () => {
    setActiveComm(null);
    setComposerOpen(true);
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load communications"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Communication Center"
        description="Compose and track mass emails, SMS, and circulars across the campus."
        crumbs={[{ label: "Operations" }, { label: "Communications" }]}
        actions={
          canManage ? (
            <Button onClick={handleCreate}>
              <Send className="mr-2 size-4" />
              New Message
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <InlineLoader label="Loading communications..." />
      ) : (
        <CommunicationList
          communications={communications}
          onEdit={handleEdit}
        />
      )}

      {composerOpen && (
        <CommunicationComposer
          open={composerOpen}
          onOpenChange={(open) => {
            setComposerOpen(open);
            if (!open) setActiveComm(null);
          }}
          communication={activeComm}
        />
      )}
    </>
  );
}
