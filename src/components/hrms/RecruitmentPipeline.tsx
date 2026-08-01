import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateApplicantStage } from "@/hooks/hrms/useRecruitment";
import type { ApplicantRow } from "@/hooks/hrms/useRecruitment";
import { ChevronRight, Mail, Phone } from "lucide-react";

const STAGES = [
  { key: "applied", label: "Applied", color: "bg-slate-500" },
  { key: "screening", label: "Screening", color: "bg-blue-500" },
  { key: "interview", label: "Interview", color: "bg-amber-500" },
  { key: "offer", label: "Offer", color: "bg-purple-500" },
  { key: "hired", label: "Hired", color: "bg-green-500" },
  { key: "rejected", label: "Rejected", color: "bg-red-500" },
] as const;

type Stage = (typeof STAGES)[number]["key"];

interface RecruitmentPipelineProps {
  applicants: ApplicantRow[];
}

export function RecruitmentPipeline({ applicants }: RecruitmentPipelineProps) {
  const { mutateAsync: updateStage } = useUpdateApplicantStage();

  const applicantsByStage = (stage: Stage) => applicants.filter((a) => a.stage === stage);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div key={stage.key} className="flex-shrink-0 w-72">
          <div
            className={`${stage.color} text-white rounded-t-lg px-3 py-2 flex items-center justify-between`}
          >
            <span className="font-medium text-sm">{stage.label}</span>
            <Badge className="bg-white/20 text-white border-0 text-xs">
              {applicantsByStage(stage.key).length}
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-b-lg border border-t-0 min-h-32">
            <ScrollArea className="max-h-[60vh]">
              <div className="p-2 space-y-2">
                {applicantsByStage(stage.key).map((applicant) => (
                  <Card key={applicant.id} className="shadow-sm">
                    <CardHeader className="p-3 pb-1">
                      <p className="font-semibold text-sm">
                        {applicant.first_name} {applicant.last_name}
                      </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 space-y-2">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {applicant.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {applicant.email}
                          </span>
                        )}
                        {applicant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {applicant.phone}
                          </span>
                        )}
                      </div>
                      {stage.key !== "hired" && stage.key !== "rejected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs w-full justify-between"
                          onClick={() => {
                            const nextIdx = STAGES.findIndex((s) => s.key === stage.key) + 1;
                            if (nextIdx < STAGES.length) {
                              updateStage({
                                id: applicant.id,
                                stage: STAGES[nextIdx].key,
                              });
                            }
                          }}
                        >
                          Move to Next
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      ))}
    </div>
  );
}
