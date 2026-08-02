import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRMMutations } from "@/hooks/useCRM";
import { CRMLead, CRMLeadStatus, CRM_LEAD_STATUSES, CRM_LEAD_SOURCES } from "@/lib/crm";
import { PhoneCall, Mail, Calendar, UserPlus, ArrowRight } from "lucide-react";

interface LeadKanbanProps {
  leads: CRMLead[];
  onLogFollowup: (lead: CRMLead) => void;
  canManage: boolean;
}

export function LeadKanban({ leads, onLogFollowup, canManage }: LeadKanbanProps) {
  const { updateLead } = useCRMMutations();

  const getSourceLabel = (source: string) => {
    return CRM_LEAD_SOURCES.find((s) => s.value === source)?.label ?? source;
  };

  const handleMove = (lead: CRMLead, newStatus: CRMLeadStatus) => {
    if (!canManage) return;
    updateLead.mutate({
      id: lead.id,
      values: { status: newStatus },
    });
  };

  const board = CRM_LEAD_STATUSES.map((status) => ({
    ...status,
    leads: leads.filter((l) => l.status === status.value),
  }));

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
      {board.map((column, index) => (
        <div key={column.value} className="flex h-full w-[350px] min-w-[350px] flex-col rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-card rounded-t-xl">
            <h3 className="font-semibold text-sm">{column.label}</h3>
            <Badge variant="secondary">{column.leads.length}</Badge>
          </div>
          
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {column.leads.map((lead) => (
              <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow cursor-default">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold truncate">
                      {lead.first_name} {lead.last_name ?? ""}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {getSourceLabel(lead.source)}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {lead.email && <span className="block truncate">{lead.email}</span>}
                    {lead.phone && <span className="block">{lead.phone}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {lead.program && (
                    <p className="text-xs text-muted-foreground mb-3 truncate">
                      Interested in: {lead.program.name}
                    </p>
                  )}
                  
                  {canManage && (
                    <div className="flex items-center justify-between border-t pt-2 mt-1 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onLogFollowup(lead)}
                      >
                        <PhoneCall className="mr-1 size-3" />
                        Log activity
                      </Button>
                      
                      <div className="flex gap-1">
                        {index < board.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleMove(lead, board[index + 1].value)}
                            title={`Move to ${board[index + 1].label}`}
                          >
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {column.leads.length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 text-muted-foreground border-2 border-dashed rounded-lg bg-card/50">
                <span className="text-xs">No leads</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
