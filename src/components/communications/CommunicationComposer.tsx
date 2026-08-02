import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useCommunicationMutations } from "@/hooks/useCommunications";
import { Communication, COMMUNICATION_TYPES } from "@/lib/communications";
import { useAccess } from "@/hooks/useAccess";

interface CommunicationComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communication?: Communication | null;
}

export function CommunicationComposer({ open, onOpenChange, communication }: CommunicationComposerProps) {
  const { createCommunication, updateCommunication } = useCommunicationMutations();
  const { campus } = useAccess();
  
  const isEditing = !!communication;

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Message" : "New Message"}
      description={isEditing ? "Update your draft message." : "Compose a new circular, email, or SMS."}
      submitLabel={isEditing ? "Save changes" : "Send / Save"}
      initialValues={
        communication ?? {
          type: "circular",
          status: "draft",
        }
      }
      fields={[
        {
          name: "type",
          label: "Message Type",
          type: "select",
          options: COMMUNICATION_TYPES,
          required: true,
        },
        { name: "title", label: "Subject / Title", required: true },
        { 
          name: "content", 
          label: "Message Content", 
          type: "textarea",
          required: true 
        },
        {
          name: "status",
          label: "Action",
          type: "select",
          options: [
            { value: "draft", label: "Save as Draft" },
            { value: "sent", label: "Send Immediately" }
          ],
          required: true,
        },
        // We'd ideally have a multi-select for recipients here. For simplicity we skip recipientIds in this basic form
        // and rely on a broadcast mechanism or future enhancement.
      ]}
      onSubmit={async (values) => {
        if (isEditing) {
          await updateCommunication.mutateAsync({
            id: communication.id,
            values: {
              ...values,
              type: values.type as any,
              status: values.status as any,
            },
          });
        } else {
          await createCommunication.mutateAsync({
            ...values,
            type: values.type as any,
            status: values.status as any,
            campus_id: campus?.id,
            recipientIds: [], // Broadcast by default for now
          });
        }
      }}
    />
  );
}
