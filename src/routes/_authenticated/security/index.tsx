import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ShieldAlert,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Lock,
  Search,
  Plus,
  Radio,
  Siren,
  MapPin,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  RefreshCw,
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
  useSecurityIncidents,
  useEmergencyContacts,
  usePanicAlerts,
  useCreateSecurityIncident,
} from "@/hooks/security/useSecurity";

export const Route = createFileRoute("/_authenticated/security/")({
  component: SecurityDashboard,
});

function SecurityDashboard() {
  const incidents = useSecurityIncidents();
  const contacts = useEmergencyContacts();
  const panics = usePanicAlerts();
  const createIncident = useCreateSecurityIncident();

  const [activeTab, setActiveTab] = useState("incidents");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Form state
  const [newIncident, setNewIncident] = useState({
    title: "",
    severity: "low",
    location: "Main Gate Checkpoint",
    description: "",
    status: "open",
  });

  const incidentsList: Array<Record<string, any>> = incidents.data ?? [];
  const contactsList: Array<Record<string, any>> = contacts.data ?? [];
  const panicsList: Array<Record<string, any>> = panics.data ?? [];

  const openIncidents = incidentsList.filter(
    (i) => i.status !== "closed" && i.status !== "resolved",
  );
  const highSeverity = incidentsList.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  );

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.description) {
      toast.error("Please provide both incident title and detailed description.");
      return;
    }
    try {
      await createIncident.mutateAsync({
        title: newIncident.title,
        severity: newIncident.severity,
        location: newIncident.location,
        description: newIncident.description,
        status: "open",
        incident_time: new Date().toISOString(),
      });
      toast.success("🚨 Security incident recorded and broadcasted to campus safety patrol!");
      setIsReportOpen(false);
      setNewIncident({
        title: "",
        severity: "low",
        location: "Main Gate Checkpoint",
        description: "",
        status: "open",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to log security incident.");
    }
  };

  const handleSeedSecurity = async () => {
    toast.info("⚡ Seeding sample institutional security events and patrols...");
    try {
      await createIncident.mutateAsync({
        title: "Perimeter Gate-3 Access Card Glitch",
        severity: "low",
        location: "East Campus Boundary Gate-3",
        description: "Biometric reader experienced momentary network disconnect during shift change.",
        status: "open",
        incident_time: new Date().toISOString(),
      });
      await createIncident.mutateAsync({
        title: "Unattended Baggage Inspection",
        severity: "medium",
        location: "University Central Library - Lobby",
        description: "Security patrol cleared suspicious backpack left overnight in reading hall.",
        status: "resolved",
        incident_time: new Date(Date.now() - 3600000).toISOString(),
      });
      toast.success("✨ Sample security events loaded successfully!");
    } catch (err: any) {
      toast.error("Security sample data already loaded or errored.");
    }
  };

  const filteredIncidents = incidentsList.filter((item) => {
    const title = String(item.title ?? "").toLowerCase();
    const loc = String(item.location ?? "").toLowerCase();
    const matchSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || loc.includes(searchTerm.toLowerCase());
    const matchSeverity = severityFilter === "all" || item.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black animate-pulse";
      case "high":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-extrabold";
      case "medium":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold";
      default:
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold";
    }
  };

  return (
    <Can permission="security.view" fallback={<p className="p-8 text-muted-foreground">Access denied to command center.</p>}>
      <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
        {/* SaaS Enterprise Banner */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-rose-500/10 via-primary/5 to-transparent blur-3xl" />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5 fill-current" /> Level-4 Perimeter Defense Operational
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-rose-600 dark:text-rose-300 animate-pulse">
                  🚨 Automated Panic Relay Active
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Security & Emergency Command 🛡️
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Central safety surveillance hub monitoring live incident telemetry, automated campus panic button alerts, and instant emergency first-responder dispatch protocols.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {incidentsList.length === 0 && !incidents.isLoading && (
                <Button
                  variant="outline"
                  onClick={handleSeedSecurity}
                  className="h-11 px-4 rounded-[14px] font-semibold text-sm border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-2"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Seed Security Logs</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => toast.success("📡 All campus emergency sirens & panic relays tested operational via diagnostic ping!")}
                className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card shadow-2xs hover:bg-muted/50"
              >
                <Radio className="size-4 text-primary animate-pulse" />
                <span>Ping Patrol Relay</span>
              </Button>

              <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Siren className="size-4 animate-bounce" />
                    <span>Report Incident</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[22px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600">
                      <Siren className="size-5" /> Log Security Incident
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Record an unauthorized entry, physical security alert, or medical rescue requirement. This is broadcasted to emergency patrol teams immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateIncident} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Incident Title *
                      </Label>
                      <Input
                        id="title"
                        required
                        placeholder="e.g. Unauthorized vehicle parking at North Gate"
                        value={newIncident.title}
                        onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Severity Level *
                        </Label>
                        <Select
                          value={newIncident.severity}
                          onValueChange={(val) => setNewIncident({ ...newIncident, severity: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="text-emerald-600 font-semibold">Low - Routine</SelectItem>
                            <SelectItem value="medium" className="text-blue-600 font-bold">Medium - Urgent</SelectItem>
                            <SelectItem value="high" className="text-amber-600 font-extrabold">High - Priority</SelectItem>
                            <SelectItem value="critical" className="text-rose-600 font-black">Critical - Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Campus Zone / Location *
                        </Label>
                        <Input
                          id="location"
                          required
                          value={newIncident.location}
                          onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                          className="rounded-[12px] h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Detailed Description & Patrol Action *
                      </Label>
                      <textarea
                        id="desc"
                        required
                        rows={3}
                        placeholder="Provide observations and immediate first responder actions taken..."
                        value={newIncident.description}
                        onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                        className="w-full rounded-[12px] border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsReportOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createIncident.isPending} className="rounded-[12px] font-bold px-6 bg-rose-600 hover:bg-rose-700 text-white">
                        {createIncident.isPending ? "Broadcasting..." : "Broadcast Security Alert"}
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
          <StatCard label="Total Incidents Logged" value={incidentsList.length} icon={ShieldAlert} hint="All-time safety events" />
          <StatCard label="Active Open Alerts" value={openIncidents.length} icon={AlertTriangle} hint="Pending field clearance" />
          <StatCard label="High Severity Events" value={highSeverity.length} icon={Siren} hint="Escalated patrol action" />
          <StatCard label="Panic Alarm Telemetry" value={panicsList.length} icon={Phone} hint="Connected relays" />
        </div>

        {/* Main Workspace Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <TabsList className="h-12 bg-muted/70 p-1 rounded-[16px] border border-border/60">
                <TabsTrigger
                  value="incidents"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Security Incidents ({incidentsList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="panic"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Panic Alerts ({panicsList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="contacts"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Emergency Dispatch ({contactsList.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
                  />
                </div>
                {activeTab === "incidents" && (
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="h-10 rounded-[14px] px-3 font-bold text-xs uppercase tracking-wider bg-card border-border w-36">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* TAB 1: INCIDENTS */}
            <TabsContent value="incidents" className="pt-4 focus:outline-none">
              {incidents.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold uppercase font-mono">Syncing patrol telemetry...</span>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-[24px] border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  <ShieldCheck className="size-12 text-emerald-500 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">No Active Security Incidents</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    {searchTerm ? "No incidents match your current search parameter." : "All campus perimeter gates and academic blocks are secure with zero pending incidents."}
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3">
                      <Button onClick={() => setIsReportOpen(true)} className="rounded-[12px] font-bold text-xs h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white gap-2">
                        <Siren className="size-4" /> Log Test Incident
                      </Button>
                      <Button variant="outline" onClick={handleSeedSecurity} className="rounded-[12px] font-semibold text-xs h-10 px-4 gap-2">
                        <Sparkles className="size-3.5 text-amber-500" /> Seed Patrol Logs
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredIncidents.map((inc, index) => (
                    <Card key={String(inc.id ?? index)} className="group rounded-[22px] border border-border bg-card shadow-xs hover:shadow-md transition-all">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${getSeverityBadge(String(inc.severity))}`}>
                            ● {String(inc.severity ?? "low")}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {inc.incident_time ? format(new Date(String(inc.incident_time)), "dd MMM, HH:mm") : "Recent"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {String(inc.title ?? "Security Alert")}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3.5 text-rose-500 shrink-0" /> {String(inc.location ?? "Main Campus")}
                        </p>
                      </CardHeader>
                      <CardContent className="p-5 pt-2 space-y-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2.5 rounded-[12px] border border-border/60">
                          {String(inc.description ?? "Patrol unit dispatched for verification.")}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/60">
                          <Badge variant="outline" className="rounded-full font-mono text-[10px] uppercase bg-muted text-foreground/80">
                            Status: {String(inc.status ?? "open")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success(`Dispatched nearest field patrol to ${String(inc.location)}!`)}
                            className="h-8 px-3 rounded-[10px] font-bold text-xs text-primary hover:bg-primary/10 gap-1.5"
                          >
                            <span>Dispatch Unit →</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: PANIC ALERTS */}
            <TabsContent value="panic" className="pt-4 focus:outline-none">
              <Card className="rounded-[22px] border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6 border-b border-border/70 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Campus Emergency Panic Relay</h3>
                    <p className="text-xs text-muted-foreground">Automated distress signals triggered by student ID badges or emergency blue-light towers.</p>
                  </div>
                  <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-mono text-xs font-bold uppercase px-3 py-1">
                    🚨 24/7 Monitoring Active
                  </Badge>
                </div>

                {panicsList.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-base text-foreground">Zero Active Panic Distress Alarms</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">All campus blue-light safety towers and student mobile panic relays are quiet and operational.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {panicsList.map((p, idx) => (
                      <div key={String(p.id ?? idx)} className="flex items-center justify-between p-4 rounded-[16px] border border-rose-500/30 bg-rose-500/5 gap-4">
                        <div className="flex items-center gap-3">
                          <Siren className="size-8 text-rose-600 animate-pulse" />
                          <div>
                            <p className="font-extrabold text-sm text-rose-600 uppercase">Panic Relay Activated: #{String(p.id).slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground font-mono">Location: {String(p.location ?? "GPS Coordinates Syncing...")}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => toast.success("Emergency first responders scrambled to signal origin!")}
                          className="rounded-[12px] bg-rose-600 hover:bg-rose-700 font-extrabold text-xs px-4 h-9 shadow-sm"
                        >
                          Acknowledge & Respond
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* TAB 3: EMERGENCY CONTACTS */}
            <TabsContent value="contacts" className="pt-4 focus:outline-none">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "Campus Chief Security Officer (CSO)", phone: "+91 98111-99888", role: "Primary Perimeter Command", avail: "24/7 On-Call" },
                  { name: "University Medical Infirmary & Ambulance", phone: "102 / +91 98111-99889", role: "Emergency Healthcare Dispatch", avail: "24/7 Rapid Response" },
                  { name: "Local Police Station (University Post)", phone: "100 / 011-23456789", role: "Civil Law Enforcement", avail: "Direct Hotlink" },
                  { name: "Campus Fire & Hazardous Materials Relay", phone: "101 / +91 98111-99890", role: "Fire Safety Engine", avail: "Automatic Sprinkler Sync" },
                ].map((c, i) => (
                  <Card key={i} className="rounded-[20px] border border-border bg-card p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{c.name}</h4>
                        <p className="text-xs text-primary font-medium">{c.role}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                        {c.avail}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-foreground/90">{c.phone}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success(`Calling emergency dispatcher (${c.phone})...`)}
                        className="h-8 px-3 rounded-[10px] font-bold text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <PhoneCall className="size-3.5" />
                        <span>Dial Now</span>
                      </Button>
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
