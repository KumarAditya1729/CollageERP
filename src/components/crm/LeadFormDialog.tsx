import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useCRMMutations } from "@/hooks/useCRM";
import { CRMLead, CRM_LEAD_SOURCES, CRM_LEAD_STATUSES } from "@/lib/crm";
import { useStudentLookups } from "@/hooks/useStudents";
import { useAccess } from "@/hooks/useAccess";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: CRMLead | null;
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const { createLead, updateLead } = useCRMMutations();
  const { campus } = useAccess();
  const lookups = useStudentLookups();
  
  const isEditing = !!lead;

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit lead" : "New lead"}
      description={isEditing ? "Update lead details." : "Create a new lead to track in the CRM."}
      submitLabel={isEditing ? "Save changes" : "Create lead"}
      initialValues={
        lead ?? {
          status: "new",
          source: "walk_in",
        }
      }
      fields={[
        { name: "first_name", label: "First name", required: true },
        { name: "last_name", label: "Last name" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        {
          name: "source",
          label: "Source",
          type: "select",
          options: CRM_LEAD_SOURCES,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: CRM_LEAD_STATUSES,
        },
        {
          name: "program_interest_id",
          label: "Program of interest",
          type: "select",
          options: (lookups.data?.programs ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      onSubmit={async (values) => {
        if (isEditing) {
          await updateLead.mutateAsync({
            id: lead.id,
            values: {
              ...values,
              source: values.source as any,
              status: values.status as any,
            },
          });
        } else {
          await createLead.mutateAsync({
            ...values,
            source: values.source as any,
            status: values.status as any,
            campus_id: campus?.id,
          });
        }
      }}
    />
  );
}
