import { DataTable } from "@/components/common/data-table";
import { StatutoryReport, STATUTORY_REPORT_TYPES, COMPLIANCE_STATUSES } from "@/lib/compliance";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ComplianceTableProps {
  reports: StatutoryReport[];
  onEdit: (report: StatutoryReport) => void;
}

export function ComplianceTable({ reports, onEdit }: ComplianceTableProps) {
  const getBadgeVariantForStatus = (status: string) => {
    switch (status) {
      case "submitted":
        return "default";
      case "under_review":
        return "secondary";
      case "pending":
        return "destructive";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getLabelForType = (type: string) => {
    return STATUTORY_REPORT_TYPES.find((t) => t.value === type)?.label ?? type;
  };

  const getLabelForStatus = (status: string) => {
    return COMPLIANCE_STATUSES.find((s) => s.value === status)?.label ?? status;
  };

  return (
    <DataTable
      data={reports}
      getRowId={(row) => row.id}
      columns={[
        {
          key: "title",
          header: "Report Title",
          render: (row) => (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{row.title}</span>
              {row.notes && (
                <span className="text-xs text-muted-foreground truncate max-w-sm">
                  {row.notes}
                </span>
              )}
            </div>
          ),
        },
        {
          key: "report_type",
          header: "Statutory Type",
          render: (row) => getLabelForType(row.report_type),
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
          key: "period",
          header: "Coverage Period",
          render: (row) => {
            if (!row.period_start && !row.period_end) return "-";
            const start = row.period_start ? format(new Date(row.period_start), "PP") : "Start";
            const end = row.period_end ? format(new Date(row.period_end), "PP") : "Ongoing";
            return `${start} — ${end}`;
          },
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
