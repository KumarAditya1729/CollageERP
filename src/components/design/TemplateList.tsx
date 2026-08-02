import { DataTable } from "@/components/common/data-table";
import { DesignTemplate, TEMPLATE_TYPES } from "@/lib/design";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TemplateListProps {
  templates: DesignTemplate[];
  onEdit: (template: DesignTemplate) => void;
}

export function TemplateList({ templates, onEdit }: TemplateListProps) {
  const getLabelForType = (type: string) => {
    return TEMPLATE_TYPES.find((t) => t.value === type)?.label ?? type;
  };

  return (
    <DataTable
      data={templates}
      getRowId={(row) => row.id}
      columns={[
        {
          key: "name",
          header: "Template Name",
          render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
          key: "type",
          header: "Type",
          render: (row) => getLabelForType(row.type),
        },
        {
          key: "is_active",
          header: "Status",
          render: (row) => (
            <Badge variant={row.is_active ? "default" : "secondary"}>
              {row.is_active ? "Active" : "Inactive"}
            </Badge>
          ),
        },
        {
          key: "updated_at",
          header: "Last Updated",
          render: (row) => format(new Date(row.updated_at), "PPp"),
        },
      ]}
      onRowClick={onEdit}
    />
  );
}
