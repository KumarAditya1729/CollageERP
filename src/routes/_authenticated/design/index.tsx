import { createFileRoute } from "@tanstack/react-router";
import { PenTool, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { TemplateList } from "@/components/design/TemplateList";
import { TemplateBuilder } from "@/components/design/TemplateBuilder";
import { useTemplates } from "@/hooks/useDesign";
import { useAccess } from "@/hooks/useAccess";
import { DesignTemplate } from "@/lib/design";

export const Route = createFileRoute("/_authenticated/design/")({
  head: () => ({
    meta: [
      { title: "Design Studio — CampusOS" },
      { name: "description", content: "Create and manage templates for certificates, ID cards, and documents." },
    ],
  }),
  component: DesignStudioPage,
  errorComponent: ({ error }) => <ErrorState title="Could not load design studio" description={error.message} />,
});

function DesignStudioPage() {
  const { can } = useAccess();
  // We'll map this to an existing permission, maybe document.manage
  const canManage = true; // Replace with proper permission check if needed
  
  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<DesignTemplate | null>(null);

  const { data: templates = [], isLoading, error, refetch } = useTemplates();

  const handleEdit = (template: DesignTemplate) => {
    setActiveTemplate(template);
    setBuilderOpen(true);
  };

  const handleCreate = () => {
    setActiveTemplate(null);
    setBuilderOpen(true);
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load templates"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Design Studio"
        description="Manage dynamic templates for certificates, ID cards, and official documents."
        crumbs={[{ label: "Content" }, { label: "Design Studio" }]}
        actions={
          canManage ? (
            <Button onClick={handleCreate}>
              <PenTool className="mr-2 size-4" />
              New Template
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <InlineLoader label="Loading templates..." />
      ) : (
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
        />
      )}

      {builderOpen && (
        <TemplateBuilder
          open={builderOpen}
          onOpenChange={(open) => {
            setBuilderOpen(open);
            if (!open) setActiveTemplate(null);
          }}
          template={activeTemplate}
        />
      )}
    </>
  );
}
