import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useComplianceMutations } from "@/hooks/useCompliance";
import { StatutoryReport, STATUTORY_REPORT_TYPES, COMPLIANCE_STATUSES } from "@/lib/compliance";
import { useAccess } from "@/hooks/useAccess";

interface ReportGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: StatutoryReport | null;
}

export function ReportGeneratorDialog({ open, onOpenChange, report }: ReportGeneratorDialogProps) {
  const { createReport, updateReport } = useComplianceMutations();
  const { campus } = useAccess();
  
  const isEditing = !!report;

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Statutory Report" : "New Statutory Report"}
      description={isEditing ? "Modify filing status or upload documents." : "Log a new statutory report, audit filing, or accreditation doc."}
      submitLabel={isEditing ? "Save changes" : "Create entry"}
      initialValues={
        report ? {
          ...report,
          period_start: report.period_start ? report.period_start.slice(0, 10) : "",
          period_end: report.period_end ? report.period_end.slice(0, 10) : "",
        } : {
          report_type: "ugc",
          status: "pending",
        }
      }
      fields={[
        {
          name: "report_type",
          label: "Report / Compliance Type",
          type: "select",
          options: STATUTORY_REPORT_TYPES,
          required: true,
        },
        { name: "title", label: "Title / Reference", required: true },
        {
          name: "status",
          label: "Filing Status",
          type: "select",
          options: COMPLIANCE_STATUSES,
          required: true,
        },
        { name: "period_start", label: "Period Start Date", type: "date" },
        { name: "period_end", label: "Period End Date", type: "date" },
        { name: "document_url", label: "Document URL / Link", type: "text" },
        { name: "notes", label: "Remarks / Notes", type: "textarea" },
      ]}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          report_type: values.report_type as any,
          status: values.status as any,
          period_start: values.period_start ? new Date(values.period_start).toISOString() : null,
          period_end: values.period_end ? new Date(values.period_end).toISOString() : null,
        };

        if (isEditing) {
          await updateReport.mutateAsync({
            id: report.id,
            values: payload,
          });
        } else {
          await createReport.mutateAsync({
            ...payload,
            campus_id: campus?.id,
          });
        }
      }}
    />
  );
}
