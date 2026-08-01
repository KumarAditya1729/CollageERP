import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useJobPositions, useApplicants } from "@/hooks/hrms/useRecruitment";
import { RecruitmentPipeline } from "@/components/hrms/RecruitmentPipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/hrms/recruitment")({
  component: RecruitmentPage,
});

function RecruitmentPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const { data: jobs, isLoading: jobsLoading } = useJobPositions();
  const { data: applicants, isLoading: appsLoading } = useApplicants(selectedJobId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job openings and applicant pipeline</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Post New Position
        </Button>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Applicant Pipeline</TabsTrigger>
          <TabsTrigger value="positions">Job Positions ({jobs?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {/* Job Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedJobId === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedJobId(undefined)}
            >
              All Positions
            </Button>
            {jobs?.map((job) => (
              <Button
                key={job.id}
                variant={selectedJobId === job.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedJobId(job.id)}
              >
                {job.title}
              </Button>
            ))}
          </div>

          {appsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading pipeline...</div>
          ) : (
            <RecruitmentPipeline applicants={applicants ?? []} />
          )}
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          {jobsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs?.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedJobId(job.id);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <Badge variant={job.status === "open" ? "default" : "secondary"}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>Openings: {job.openings}</p>
                    <p>{job.employment_type.replace("_", " ")}</p>
                    {job.closing_date && (
                      <p>Closes: {new Date(job.closing_date).toLocaleDateString()}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {jobs?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No job positions created yet.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
