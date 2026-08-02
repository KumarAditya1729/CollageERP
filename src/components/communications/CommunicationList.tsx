import { DataTable } from "@/components/common/data-table";
import { Communication, COMMUNICATION_TYPES, COMMUNICATION_STATUSES } from "@/lib/communications";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CommunicationListProps {
  communications: Communication[];
  onEdit: (communication: Communication) => void;
}

export function CommunicationList({ communications, onEdit }: CommunicationListProps) {
  const getBadgeVariantForStatus = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "scheduled":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getLabelForType = (type: string) => {
    return COMMUNICATION_TYPES.find((t) => t.value === type)?.label ?? type;
  };

  const getLabelForStatus = (status: string) => {
    return COMMUNICATION_STATUSES.find((s) => s.value === status)?.label ?? status;
  };

  return (
    <DataTable
      data={communications}
      getRowId={(row) => row.id}
      columns={[
        {
          key: "title",
          header: "Subject / Title",
          render: (row) => (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{row.title}</span>
              <span className="text-xs text-muted-foreground truncate max-w-sm">
                {row.content}
              </span>
            </div>
          ),
        },
        {
          key: "type",
          header: "Type",
          render: (row) => getLabelForType(row.type),
        },
        {
          key: "status",
          header: "Status",
          render: (row) => (
            <Badge variant={getBadgeVariantForStatus(row.status)}>
              {getLabelForStatus(row.status)}
            </Badge>
          ),
        },
        {
          key: "sent_at",
          header: "Sent At",
          render: (row) => (row.sent_at ? format(new Date(row.sent_at), "PPp") : "-"),
        },
        {
          key: "sent_by",
          header: "Sent By",
          render: (row) => 
            row.sender ? `${row.sender.first_name} ${row.sender.last_name ?? ""}` : "-",
        },
      ]}
      onRowClick={onEdit}
    />
  );
}
