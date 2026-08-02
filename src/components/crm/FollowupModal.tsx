import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useCRMFollowups } from "@/hooks/useCRM";
import { CRMLead, CRM_FOLLOWUP_TYPES } from "@/lib/crm";

interface FollowupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CRMLead | null;
}

export function FollowupModal({ open, onOpenChange, lead }: FollowupModalProps) {
  const { logFollowup } = useCRMFollowups(lead?.id);

  if (!lead) return null;

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Log Follow-up"
      description={`Record activity for ${lead.first_name} ${lead.last_name ?? ""}.`}
      submitLabel="Log Activity"
      initialValues={{
        date: new Date().toISOString().slice(0, 16),
        type: "call",
      }}
      fields={[
        {
          name: "type",
          label: "Type",
          type: "select",
          options: CRM_FOLLOWUP_TYPES,
          required: true,
        },
        { 
          name: "date", 
          label: "Date & Time", 
          type: "datetime-local",
          required: true 
        },
        { 
          name: "notes", 
          label: "Notes", 
          type: "textarea",
          required: true
        },
        { 
          name: "next_followup_date", 
          label: "Next Follow-up Date (Optional)", 
          type: "datetime-local" 
        },
      ]}
      onSubmit={async (values) => {
        await logFollowup.mutateAsync({
          lead_id: lead.id,
          type: values.type as any,
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          notes: values.notes,
          next_followup_date: values.next_followup_date ? new Date(values.next_followup_date).toISOString() : null,
        });
      }}
    />
  );
}
