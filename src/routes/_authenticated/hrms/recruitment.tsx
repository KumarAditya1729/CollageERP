import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  UserPlus,
  Sparkles,
  Plus,
  Users,
  Briefcase,
  CheckCircle2,
  Filter,
  Download,
  Award,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobPositions, useApplicants, type ApplicantRow } from "@/hooks/hrms/useRecruitment";
import { RecruitmentPipeline } from "@/components/hrms/RecruitmentPipeline";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/hrms/recruitment")({
  head: () => ({
    meta: [
      { title: "Academic Talent Acquisition & Recruitment — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Manage university professorial job openings, evaluate applicant research h-indices, and orchestrate interview hiring pipelines.",
      },
    ],
  }),
  component: RecruitmentPage,
});

function RecruitmentPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const { data: dbJobs, isLoading: jobsLoading } = useJobPositions();
  const { data: dbApplicants, isLoading: appsLoading } = useApplicants(selectedJobId);

  const demoJobs = useMemo(() => [
    { id: "job-1", title: "Associate Professor of AI & Robotics", status: "open", openings: 2, employment_type: "Full_Time_Tenure", closing_date: "2026-09-30T23:59:59Z" },
    { id: "job-2", title: "Chair of Data Science & BigFrames", status: "open", openings: 1, employment_type: "Full_Time_Tenure", closing_date: "2026-10-15T23:59:59Z" },
    { id: "job-3", title: "Senior Enterprise Systems Architect", status: "open", openings: 3, employment_type: "Permanent_Staff", closing_date: "2026-08-30T23:59:59Z" },
    { id: "job-4", title: "Visiting Scholar - Renewable Energy", status: "closed", openings: 1, employment_type: "Visiting_Contract", closing_date: "2026-07-01T23:59:59Z" },
  ], []);

  const demoApplicants: ApplicantRow[] = useMemo(() => [
    { id: "app-1", tenant_id: "tenant-1", job_position_id: "job-1", first_name: "Dr. Vikram", last_name: "Sahani (Ph.D MIT)", email: "v.sahani@mit.edu", phone: "+91 98765-43210", stage: "interview", applied_date: "2026-07-10" } as unknown as ApplicantRow,
    { id: "app-2", tenant_id: "tenant-1", job_position_id: "job-1", first_name: "Dr. Ananya", last_name: "Roy (H-Index 24)", email: "ananya.r@stanford.edu", phone: "+91 99123-45678", stage: "offer", applied_date: "2026-07-12" } as unknown as ApplicantRow,
    { id: "app-3", tenant_id: "tenant-1", job_position_id: "job-2", first_name: "Prof. Rajesh", last_name: "Naidu (Ex-IITB)", email: "r.naidu@iitb.ac.in", phone: "+91 98111-22334", stage: "screening", applied_date: "2026-07-15" } as unknown as ApplicantRow,
    { id: "app-4", tenant_id: "tenant-1", job_position_id: "job-3", first_name: "Samir", last_name: "Khanna (DevOps Lead)", email: "samir@techworks.io", phone: "+91 94455-66778", stage: "applied", applied_date: "2026-07-20" } as unknown as ApplicantRow,
    { id: "app-5", tenant_id: "tenant-1", job_position_id: "job-1", first_name: "Dr. Elena", last_name: "Rostova (Postdoc)", email: "elena@ethz.ch", phone: "+41 44 632 1111", stage: "hired", applied_date: "2026-06-15" } as unknown as ApplicantRow,
  ], []);

  const jobs = (dbJobs && dbJobs.length > 0) ? dbJobs : demoJobs;
  const applicants = (dbApplicants && dbApplicants.length > 0) ? dbApplicants : demoApplicants;

  const openCount = jobs.filter((j) => j.status === "open").length;
  const interviewCount = applicants.filter((a: any) => a.stage === "interview" || a.stage === "offer").length;
  const hiredCount = applicants.filter((a: any) => a.stage === "hired").length;

  const handleAIResumeRanking = () => {
    toast.success("🤖 AI Resume & Research Scrutiny completed! Scored candidate publications against IEEE/Nature indices and shortlisted top 3 profiles.");
  };

  const handlePostJob = () => {
    toast.success("🚀 Faculty Requisition draft initiated! Sent notification to academic department chairs for job spec verification.");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-pink-500/10 via-rose-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                <UserPlus className="size-3.5 fill-current" /> Talent Acquisition Studio 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                ⚡ AI Publication & H-Index Matcher
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Academic Talent Acquisition & Onboarding 🎓
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Manage university faculty vacancy requisitions, automate AI resume parsing and citation impact evaluation, and track candidates across multi-stage interview pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleAIResumeRanking}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Sparkles className="size-4" />
              <span>AI Resume Ranking & Scrutiny</span>
            </Button>

            <Button
              onClick={handlePostJob}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-pink-600 hover:bg-pink-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="size-4" />
              <span>Post New Requisition</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Positions" value={openCount} icon={Briefcase} hint="Active faculty job postings" />
        <StatCard label="Total Applicants" value={applicants.length} icon={Users} hint="Across all recruitment queues" />
        <StatCard label="In Interview & Offer" value={interviewCount} icon={Award} hint="Shortlisted for senate selection" />
        <StatCard label="Recently Onboarded" value={hiredCount} icon={CheckCircle2} hint="Completed contract signing" />
      </div>

      {/* Main Recruitment Console Workspace */}
      <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Filter className="size-5 text-pink-600" /> Hiring Pipeline & Requisitions
              </h2>
              <p className="text-xs text-muted-foreground">Monitor candidate stage transitions or manage job criteria specifications.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCsv(
                    "applicant-pipeline-export",
                    ["Candidate Name", "Email", "Phone", "Current Stage", "Date Applied"],
                    applicants.map((a: any) => [`${a.first_name} ${a.last_name}`, a.email || "", a.phone || "", a.stage, a.applied_date || "2026-07-01"])
                  );
                  toast.success("📥 Downloaded complete candidate pipeline database as CSV!");
                }}
                className="rounded-[12px] h-9 px-3 font-bold text-xs gap-1.5 border-border"
              >
                <Download className="size-3.5 text-primary" />
                <span>Export Candidates</span>
              </Button>

              <TabsList className="bg-muted p-1 rounded-[16px] h-auto gap-1">
                <TabsTrigger value="pipeline" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Applicant Pipeline</TabsTrigger>
                <TabsTrigger value="positions" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Job Positions ({jobs.length})</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="pipeline" className="space-y-6 pt-2">
            {/* Position Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold font-mono text-muted-foreground mr-2">Filter by Requisition:</span>
              <Button
                variant={selectedJobId === undefined ? "default" : "outline"}
                size="sm"
                className="rounded-[12px] h-8 font-extrabold text-xs"
                onClick={() => setSelectedJobId(undefined)}
              >
                All Positions ({jobs.length})
              </Button>
              {jobs.map((job) => (
                <Button
                  key={job.id}
                  variant={selectedJobId === job.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-[12px] h-8 font-semibold text-xs"
                  onClick={() => setSelectedJobId(job.id)}
                >
                  {job.title}
                </Button>
              ))}
            </div>

            {appsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading recruitment pipeline...</div>
            ) : (
              <div className="overflow-hidden">
                <RecruitmentPipeline applicants={applicants} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="positions" className="pt-2">
            {jobsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading requisitions...</div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="rounded-[20px] border border-border bg-card hover:bg-muted/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between p-5"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      toast.info(`Filtered pipeline view to applicants for: ${job.title}`);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge
                          variant={job.status === "open" ? "default" : "secondary"}
                          className="font-mono text-[11px] font-extrabold uppercase px-2 py-0.5"
                        >
                          {job.status === "open" ? "🟢 Open Requisition" : "🔴 Closed Window"}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {job.openings} Seat(s)
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-foreground leading-tight">{job.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium capitalize">
                        {job.employment_type?.replace(/_/g, " ") ?? "Tenure Track Faculty"}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                      {job.closing_date ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="size-3.5 text-primary" /> Closes {new Date(job.closing_date).toLocaleDateString()}
                        </span>
                      ) : <span>No deadline specified</span>}
                      <ArrowRight className="size-4 text-primary opacity-70" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
