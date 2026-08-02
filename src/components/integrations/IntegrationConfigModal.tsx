import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { useIntegrationMutations } from "@/hooks/useIntegrations";
import { IntegrationCatalogItem, TenantIntegration } from "@/lib/integrations";

interface IntegrationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogItem: IntegrationCatalogItem | null;
  existing?: TenantIntegration;
}

export function IntegrationConfigModal({ open, onOpenChange, catalogItem, existing }: IntegrationConfigModalProps) {
  const { saveIntegration } = useIntegrationMutations();

  if (!catalogItem) return null;

  const dynamicFields = catalogItem.required_fields.map((f) => ({
    name: f.key,
    label: f.label,
    type: (f.type ?? "text") as any,
    required: true,
  }));

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Configure ${catalogItem.display_name}`}
      description="Enter credentials and connection parameters below to initialize communication with the remote service."
      submitLabel="Save Integration Settings"
      initialValues={{
        ...(existing?.config ?? {}),
        is_enabled: existing ? String(existing.is_enabled) : "true",
      }}
      fields={[
        {
          name: "is_enabled",
          label: "Connection State",
          type: "select",
          options: [
            { value: "true", label: "Enabled & Active" },
            { value: "false", label: "Disabled / Disconnect" },
          ],
          required: true,
        },
        ...dynamicFields,
      ]}
      onSubmit={async (values) => {
        const { is_enabled, ...config } = values;
        
        await saveIntegration.mutateAsync({
          provider_name: catalogItem.provider_name,
          display_name: catalogItem.display_name,
          category: catalogItem.category,
          config,
          is_enabled: Boolean(is_enabled && is_enabled !== "false" && is_enabled !== 0),
          existingId: existing?.id,
        });
      }}
    />
  );
}
