import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Building2, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccess } from "@/hooks/useAccess";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingWizard,
});

const DEFAULT_BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Business Administration",
];

function OnboardingWizard() {
  const navigate = useNavigate();
  const { refetch } = useAccess();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [collegeSlug, setCollegeSlug] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const toggleBranch = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleComplete = async () => {
    if (!collegeName || !collegeSlug) return toast.error("Please fill all fields");
    if (selectedBranches.length === 0) return toast.error("Please select at least one branch");

    setBusy(true);
    try {
      const { error } = await supabase.rpc("setup_new_college", {
        p_college_name: collegeName,
        p_college_slug: collegeSlug.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        p_branches: selectedBranches,
      });

      if (error) throw error;
      
      toast.success("College Workspace created successfully!");
      
      // Refetch access to load the new tenant and roles, then navigate
      await refetch();
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message || "Failed to setup workspace");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your College Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let's setup your ERP in less than 60 seconds.
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <Label htmlFor="collegeName">College / Institution Name</Label>
              <Input
                id="collegeName"
                placeholder="e.g. Northgate Institute of Technology"
                value={collegeName}
                onChange={(e) => {
                  setCollegeName(e.target.value);
                  if (!collegeSlug || collegeSlug === e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, -1)) {
                    setCollegeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collegeSlug">Workspace Slug (URL friendly)</Label>
              <div className="flex items-center rounded-md border pl-3 shadow-sm">
                <span className="text-sm text-muted-foreground">campusos.com/</span>
                <input
                  id="collegeSlug"
                  className="flex h-9 w-full bg-transparent px-2 py-1 text-sm shadow-none outline-none"
                  placeholder="northgate"
                  value={collegeSlug}
                  onChange={(e) => setCollegeSlug(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (!collegeName || !collegeSlug) {
                  toast.error("Please fill out your college details");
                  return;
                }
                setStep(2);
              }}
            >
              Continue <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <Label className="text-base">Select your core branches</Label>
              <p className="text-sm text-muted-foreground mb-4">
                We'll automatically create these departments for you. You can add more later.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DEFAULT_BRANCHES.map((branch) => {
                  const isSelected = selectedBranches.includes(branch);
                  return (
                    <div
                      key={branch}
                      onClick={() => toggleBranch(branch)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`flex size-5 items-center justify-center rounded-full border ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="size-3.5" />}
                      </div>
                      <span className="text-sm font-medium leading-none">{branch}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full" disabled={busy}>
                Back
              </Button>
              <Button onClick={handleComplete} className="w-full" disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Building2 className="mr-2 size-4" />}
                {busy ? "Creating Workspace..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
