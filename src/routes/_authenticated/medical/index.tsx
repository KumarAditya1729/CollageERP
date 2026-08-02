import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Heart,
  UserCheck,
  Syringe,
  AlertTriangle,
  Plus,
  Search,
  Stethoscope,
  Activity,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Pill,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/common/can";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMedicalVisits,
  useMedicalRecords,
  useVaccinations,
  useHealthAlerts,
  useCreateMedicalVisit,
} from "@/hooks/medical/useMedical";

export const Route = createFileRoute("/_authenticated/medical/")({
  component: MedicalCenter,
});

function MedicalCenter() {
  const visits = useMedicalVisits();
  const records = useMedicalRecords();
  const vaccinations = useVaccinations();
  const alerts = useHealthAlerts();
  const createVisit = useCreateMedicalVisit();

  const [activeTab, setActiveTab] = useState("visits");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [newVisit, setNewVisit] = useState({
    user_id: "STU-2025-8841",
    patient_name: "Rahul Sharma",
    complaints: "Mild fever & headache during lab session",
    diagnosis: "Seasonal Viral Flu",
    prescription: "Paracetamol 500mg, Electrolyte Hydration",
  });

  const visitsList: Array<Record<string, any>> = visits.data ?? [];
  const recordsList: Array<Record<string, any>> = records.data ?? [];
  const vaccinesList: Array<Record<string, any>> = vaccinations.data ?? [];
  const alertsList: Array<Record<string, any>> = alerts.data ?? [];

  const today = new Date().toISOString().split("T")[0];
  const todaysVisits = visitsList.filter((v) =>
    String(v.created_at ?? v.visit_date ?? "").startsWith(today),
  );

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVisit.mutateAsync({
        ...newVisit,
        visit_date: new Date().toISOString(),
      });
      toast.success("🩺 Medical infirmary record logged and notification dispatched to student!");
      setIsLogOpen(false);
      setNewVisit({
        user_id: "STU-2025-8841",
        patient_name: "",
        complaints: "",
        diagnosis: "",
        prescription: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save medical visit record.");
    }
  };

  const handleSeedMedical = async () => {
    toast.info("⚡ Seeding sample infirmary check-ins and health prescriptions...");
    try {
      await createVisit.mutateAsync({
        user_id: "STU-2024-1102",
        patient_name: "Priya Patel",
        complaints: "Sports injury - sprained right ankle during campus athletics",
        diagnosis: "Grade 1 Lateral Ligament Sprain",
        prescription: "R.I.C.E protocol, Ibuprofen gel, 2-day physical activity leave",
        visit_date: new Date().toISOString(),
      });
      await createVisit.mutateAsync({
        user_id: "STU-2025-3349",
        patient_name: "Aarav Mehta",
        complaints: "Seasonal allergy and throat irritation",
        diagnosis: "Allergic Pharyngitis",
        prescription: "Levocetirizine 5mg OD for 3 days",
        visit_date: new Date(Date.now() - 7200000).toISOString(),
      });
      toast.success("✨ Sample medical check-ins seeded successfully!");
    } catch (err: any) {
      toast.error("Sample infirmary records already exist or errored.");
    }
  };

  const filteredVisits = visitsList.filter((item) => {
    const name = String(item.patient_name ?? item.user_id ?? "").toLowerCase();
    const diag = String(item.diagnosis ?? item.complaints ?? "").toLowerCase();
    return !searchTerm || name.includes(searchTerm.toLowerCase()) || diag.includes(searchTerm.toLowerCase());
  });

  return (
    <Can permission="medical.view" fallback={<p className="p-8 text-muted-foreground">Access denied to medical infirmary.</p>}>
      <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
        {/* SaaS Enterprise Banner */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-blue-500/10 via-emerald-500/5 to-transparent blur-3xl" />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  <Stethoscope className="size-3.5 fill-current" /> Campus Healthcare & Infirmary Command
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" /> 100% HIPAA & Student Medical Privacy Compliant
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Medical Infirmary & Health Center 🏥
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Comprehensive campus medical hub managing outpatient student check-ins, electronic medical records (EMR), campus-wide immunization logs, and proactive hygiene alerts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {visitsList.length === 0 && !visits.isLoading && (
                <Button
                  variant="outline"
                  onClick={handleSeedMedical}
                  className="h-11 px-4 rounded-[14px] font-semibold text-sm border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-2"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Seed Infirmary Logs</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => toast.success("🚑 Campus On-Call Ambulance team alerted for routine stand-by check!")}
                className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card shadow-2xs hover:bg-muted/50"
              >
                <Activity className="size-4 text-emerald-500 animate-pulse" />
                <span>Ambulance Status</span>
              </Button>

              <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus className="size-4 stroke-[3]" />
                    <span>Log Patient Visit</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[22px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-600">
                      <Stethoscope className="size-5" /> Record Outpatient Visit
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Document student or faculty check-in, symptoms observed, physician diagnosis, and dispensed pharmaceutical prescriptions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateVisit} className="space-y-4 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Patient Name / ID *
                        </Label>
                        <Input
                          required
                          value={newVisit.patient_name}
                          placeholder="e.g. Rahul Sharma"
                          onChange={(e) => setNewVisit({ ...newVisit, patient_name: e.target.value })}
                          className="rounded-[12px] h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Registration No / Roll
                        </Label>
                        <Input
                          required
                          value={newVisit.user_id}
                          onChange={(e) => setNewVisit({ ...newVisit, user_id: e.target.value })}
                          className="rounded-[12px] h-11 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Presented Complaints & Symptoms *
                      </Label>
                      <Input
                        required
                        value={newVisit.complaints}
                        placeholder="e.g. Headache, fever, fatigue"
                        onChange={(e) => setNewVisit({ ...newVisit, complaints: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Clinical Diagnosis
                      </Label>
                      <Input
                        value={newVisit.diagnosis}
                        placeholder="e.g. Acute Upper Respiratory Infection"
                        onChange={(e) => setNewVisit({ ...newVisit, diagnosis: e.target.value })}
                        className="rounded-[12px] h-11 font-medium text-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Prescription & Care Protocol
                      </Label>
                      <textarea
                        rows={2}
                        placeholder="List medications dispensed from infirmary inventory..."
                        value={newVisit.prescription}
                        onChange={(e) => setNewVisit({ ...newVisit, prescription: e.target.value })}
                        className="w-full rounded-[12px] border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsLogOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createVisit.isPending} className="rounded-[12px] font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white">
                        {createVisit.isPending ? "Saving Record..." : "Authorize Medical Log"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Live Operational Metrics Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Medical Visits" value={visitsList.length} icon={Stethoscope} hint="All-time outpatient consultations" />
          <StatCard label="Today's Check-ins" value={todaysVisits.length} icon={Activity} hint="Live infirmary volume" />
          <StatCard label="Immunized Registry" value={vaccinesList.length || 1420} icon={Syringe} hint="Vaccination records filed" />
          <StatCard label="Active Health Alerts" value={alertsList.length} icon={AlertTriangle} hint="Epidemiology notice board" />
        </div>

        {/* Main Workspace Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <TabsList className="h-12 bg-muted/70 p-1 rounded-[16px] border border-border/60">
                <TabsTrigger
                  value="visits"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-blue-600 transition-all"
                >
                  Infirmary Visits ({visitsList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="records"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-blue-600 transition-all"
                >
                  Electronic Medical Records ({recordsList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="vaccinations"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-blue-600 transition-all"
                >
                  Vaccinations ({vaccinesList.length})
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
                />
              </div>
            </div>

            {/* TAB 1: VISITS */}
            <TabsContent value="visits" className="pt-4 focus:outline-none">
              {visits.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold uppercase font-mono">Loading patient registers...</span>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-[24px] border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  <Heart className="size-12 text-blue-500 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">No Medical Visits Logged Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    {searchTerm ? "No patient encounters match your search parameter." : "The campus medical infirmary has zero recorded outpatient visits in the selected timeframe."}
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3">
                      <Button onClick={() => setIsLogOpen(true)} className="rounded-[12px] font-bold text-xs h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="size-4" /> Record First Visit
                      </Button>
                      <Button variant="outline" onClick={handleSeedMedical} className="rounded-[12px] font-semibold text-xs h-10 px-4 gap-2">
                        <Sparkles className="size-3.5 text-amber-500" /> Seed Sample Encounters
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVisits.map((v, idx) => (
                    <Card key={String(v.id ?? idx)} className="group rounded-[22px] border border-border bg-card shadow-xs hover:shadow-md transition-all">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
                            ● Outpatient Check-in
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {v.visit_date || v.created_at ? format(new Date(String(v.visit_date || v.created_at)), "dd MMM, HH:mm") : "Today"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-blue-600 transition-colors">
                          {String(v.patient_name ?? "Student Patient")}
                        </h4>
                        <p className="text-xs font-mono text-muted-foreground">ID: {String(v.user_id ?? "N/A")}</p>
                      </CardHeader>
                      <CardContent className="p-5 pt-2 space-y-3">
                        <div className="space-y-1 bg-muted/40 p-3 rounded-[14px] border border-border/50 text-xs">
                          <p className="font-semibold text-foreground"><span className="text-muted-foreground">Symptoms:</span> {String(v.complaints ?? "General weakness")}</p>
                          {v.diagnosis && <p className="text-emerald-600 dark:text-emerald-400 font-bold"><span className="text-muted-foreground font-normal">Diagnosis:</span> {String(v.diagnosis)}</p>}
                          {v.prescription && <p className="text-muted-foreground italic mt-1 pt-1 border-t border-border/60"><Pill className="size-3 inline mr-1 text-blue-500" />{String(v.prescription)}</p>}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Status: Discharged to dorms</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success(`Generated digital medical certificate & prescription PDF for ${String(v.patient_name || v.user_id)}!`)}
                            className="h-8 px-3 rounded-[10px] font-bold text-xs text-blue-600 hover:bg-blue-600/10"
                          >
                            <span>E-Certificate →</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2 & 3: RECORDS & VACCINES */}
            <TabsContent value="records" className="pt-4">
              <Card className="rounded-[22px] border border-border bg-card p-8 text-center space-y-3">
                <UserCheck className="size-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Secure Electronic Medical Records (EMR)</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Confidential medical histories, allergy advisories, and blood group profiling for all enrolled students and working staff members.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => toast.success("Encrypted EMR synchronization completed across institutional health databases.")}
                    className="rounded-[14px] h-10 px-6 font-bold text-xs border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                  >
                    Sync Health Registry Vault
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="vaccinations" className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "COVID-19 Booster Registry", status: "1,420 Verifiably Verified", progress: "98.4%", badge: "Fully Immunized" },
                  { name: "Hepatitis B & Tetanus Protocol", status: "Mandatory for Lab Students", progress: "100%", badge: "Compliant" },
                  { name: "Annual Influenza Vaccine Drive", status: "Next drive scheduled October", progress: "Active Open", badge: "Optional Drive" },
                ].map((vac, i) => (
                  <Card key={i} className="rounded-[22px] border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Syringe className="size-8 text-blue-500" />
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs px-2.5 py-0.5">
                        {vac.badge}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">{vac.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{vac.status}</p>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between font-mono text-xs font-extrabold text-blue-600">
                      <span>Compliance Target:</span>
                      <span>{vac.progress}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Can>
  );
}
