import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useTemplateMutations } from "@/hooks/useDesign";
import { DesignTemplate, TEMPLATE_TYPES } from "@/lib/design";
import { useAccess } from "@/hooks/useAccess";

interface TemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DesignTemplate | null;
}

export function TemplateBuilder({ open, onOpenChange, template }: TemplateBuilderProps) {
  const { createTemplate, updateTemplate } = useTemplateMutations();
  const { campus } = useAccess();
  
  const isEditing = !!template;

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Template" : "New Template"}
      description={isEditing ? "Update your design template." : "Create a new certificate or ID card template."}
      submitLabel={isEditing ? "Save changes" : "Create template"}
      initialValues={
        template ? {
          ...template,
          content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2),
        } : {
          type: "certificate",
          is_active: true,
          content: "{}",
        }
      }
      fields={[
        {
          name: "type",
          label: "Template Type",
          type: "select",
          options: TEMPLATE_TYPES,
          required: true,
        },
        { name: "name", label: "Template Name", required: true },
        { 
          name: "content", 
          label: "Design Content (JSON/HTML)", 
          type: "textarea",
          required: true 
        },
        {
          name: "is_active",
          label: "Status",
          type: "select",
          options: [
            { value: true as any, label: "Active" },
            { value: false as any, label: "Inactive" }
          ],
          required: true,
        },
      ]}
      onSubmit={async (values) => {
        let parsedContent = values.content;
        try {
          // Attempt to parse if it's JSON
          if (typeof values.content === 'string' && values.content.trim().startsWith('{')) {
             parsedContent = JSON.parse(values.content);
          }
        } catch (e) {
          // Keep as string if it fails to parse (e.g. HTML snippet)
        }

        const dataToSave = {
          ...values,
          type: values.type as any,
          is_active: Boolean(values.is_active && values.is_active !== 'false' && values.is_active !== 0),
          content: parsedContent,
        };

        if (isEditing) {
          await updateTemplate.mutateAsync({
            id: template.id,
            values: dataToSave,
          });
        } else {
          await createTemplate.mutateAsync({
            ...dataToSave,
            campus_id: campus?.id,
          });
        }
      }}
    />
  );
}
