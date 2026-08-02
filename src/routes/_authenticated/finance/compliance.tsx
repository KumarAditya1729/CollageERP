import { createFileRoute } from "@tanstack/react-router";
import { FileCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { ComplianceTable } from "@/components/compliance/ComplianceTable";
import { ReportGeneratorDialog } from "@/components/compliance/ReportGeneratorDialog";
import { useStatutoryReports } from "@/hooks/useCompliance";
import { useAccess } from "@/hooks/useAccess";
import { StatutoryReport } from "@/lib/compliance";

export const Route = createFileRoute("/_authenticated/finance/compliance")({
  head: () => ({
    meta: [
      { title: "Statutory Compliance & Auditing — CampusOS" },
      { name: "description", content: "Track NAAC, UGC, AICTE documentation and tax filings." },
    ],
  }),
  component: CompliancePage,
  errorComponent: ({ error }) => <ErrorState title="Could not load compliance records" description={error.message} />,
});

function CompliancePage() {
  const { can } = useAccess();
  // We'll tie this to finance.manage or audit.view, fallback to allow for now
  const canManage = true;
  
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<StatutoryReport | null>(null);

  const { data: reports = [], isLoading, error, refetch } = useStatutoryReports();

  const handleEdit = (report: StatutoryReport) => {
    setActiveReport(report);
    setGeneratorOpen(true);
  };

  const handleCreate = () => {
    setActiveReport(null);
    setGeneratorOpen(true);
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load reports"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Statutory & Financial Compliance"
        description="Monitor tax returns, educational accreditation reports (NAAC, UGC), and internal audit findings."
        crumbs={[{ label: "Finance" }, { label: "Compliance" }]}
        actions={
          canManage ? (
            <Button onClick={handleCreate}>
              <FileCheck className="mr-2 size-4" />
              New Filing / Report
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <InlineLoader label="Loading compliance data..." />
      ) : (
        <ComplianceTable
          reports={reports}
          onEdit={handleEdit}
        />
      )}

      {generatorOpen && (
        <ReportGeneratorDialog
          open={generatorOpen}
          onOpenChange={(open) => {
            setGeneratorOpen(open);
            if (!open) setActiveReport(null);
          }}
          report={activeReport}
        />
      )}
    </>
  );
}
