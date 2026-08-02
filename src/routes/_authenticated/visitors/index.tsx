import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  UsersRound,
  ShieldCheck,
  Clock,
  Lock,
  Search,
  Plus,
  Ticket,
  QrCode,
  Printer,
  FileText,
  UserCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
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
  useVisitors,
  useVisitorPasses,
  useCreateVisitor,
  useCreateVisitorPass,
} from "@/hooks/visitor/useVisitor";

export const Route = createFileRoute("/_authenticated/visitors/")({
  component: VisitorManagement,
});

interface Visitor {
  id?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  email?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  visitor_type?: string;
  created_at?: string;
}

interface VisitorPass {
  id?: string;
  visitor_id?: string;
  purpose?: string;
  status?: string;
  pass_code?: string;
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
  destination?: string;
  visitors?: {
    full_name?: string;
    phone?: string;
  };
}

function VisitorManagement() {
  const visitorsQuery = useVisitors();
  const passesQuery = useVisitorPasses();
  const createVisitor = useCreateVisitor();
  const createPass = useCreateVisitorPass();

  const [activeTab, setActiveTab] = useState("visitors");
  const [searchTerm, setSearchTerm] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");

  // Dialog States
  const [isAddVisitorOpen, setIsAddVisitorOpen] = useState(false);
  const [isIssuePassOpen, setIsIssuePassOpen] = useState(false);
  const [selectedPassForBadge, setSelectedPassForBadge] = useState<VisitorPass | null>(null);

  // New Visitor Form State
  const [newVisitor, setNewVisitor] = useState({
    full_name: "",
    phone: "",
    email: "",
    id_proof_type: "Aadhaar Card",
    id_proof_number: "",
  });

  // New Pass Form State
  const [newPass, setNewPass] = useState({
    visitor_id: "",
    purpose: "official",
    destination: "Admin Block - Secretariat",
    pass_code: `GATE-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  const visitorsList: Visitor[] = visitorsQuery.data ?? [];
  const passesList: VisitorPass[] = passesQuery.data ?? [];

  const totalVisitors = visitorsList.length;
  const activePasses = passesList.filter((p) => p.status === "active").length;
  const todayPasses = passesList.filter((p) => {
    const d = String(p.created_at ?? p.valid_from ?? "");
    return d.startsWith(new Date().toISOString().split("T")[0]);
  }).length;

  // Handlers
  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.full_name || !newVisitor.phone) {
      toast.error("Please provide both full name and contact number.");
      return;
    }
    try {
      await createVisitor.mutateAsync({
        full_name: newVisitor.full_name,
        phone: newVisitor.phone,
        email: newVisitor.email || null,
        id_proof_type: newVisitor.id_proof_type,
        id_proof_number: newVisitor.id_proof_number || null,
      });
      toast.success(`🎉 Successfully registered visitor: ${newVisitor.full_name}`);
      setIsAddVisitorOpen(false);
      setNewVisitor({
        full_name: "",
        phone: "",
        email: "",
        id_proof_type: "Aadhaar Card",
        id_proof_number: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to register visitor. Phone number might already exist.");
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.visitor_id) {
      toast.error("Please select a valid registered visitor.");
      return;
    }
    const selectedVis = visitorsList.find((v) => v.id === newPass.visitor_id);
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 8); // 8 hour gate validity

    try {
      await createPass.mutateAsync({
        visitor_id: newPass.visitor_id,
        purpose: newPass.purpose,
        pass_code: newPass.pass_code,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        status: "active",
        destination: newPass.destination,
        visitor_name: selectedVis?.full_name ?? selectedVis?.name ?? "Guest",
      });
      toast.success("🎟️ Gate pass generated and logged into Campus Security incidents Engine!");
      setIsIssuePassOpen(false);
      setNewPass({
        visitor_id: "",
        purpose: "official",
        destination: "Admin Block - Secretariat",
        pass_code: `GATE-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setActiveTab("passes");
    } catch (err: any) {
      toast.error(err?.message || "Failed to issue gate pass.");
    }
  };

  const handleSeedData = async () => {
    toast.info("⚡ Creating sample campus visitors and active gate passes...");
    try {
      const sample1 = await createVisitor.mutateAsync({
        full_name: "Dr. Rajesh Vaidya",
        phone: "+91 9811122334",
        email: "r.vaidya@accreditation-board.gov.in",
        id_proof_type: "Aadhaar Card",
        id_proof_number: "XXXX-XXXX-4892",
      });
      const sample2 = await createVisitor.mutateAsync({
        full_name: "Vikram Solutions (Server Hardware)",
        phone: "+91 9722233445",
        email: "support@vikramtech.in",
        id_proof_type: "Company ID",
        id_proof_number: "VTECH-882",
      });
      await createVisitor.mutateAsync({
        full_name: "Sunita Sharma (Guardian)",
        phone: "+91 9933344556",
        email: "s.sharma@gmail.com",
        id_proof_type: "Driving License",
        id_proof_number: "DL-04-2019829",
      });

      if (sample1?.id) {
        const now = new Date();
        const end = new Date();
        end.setHours(end.getHours() + 6);
        await createPass.mutateAsync({
          visitor_id: sample1.id,
          purpose: "official",
          pass_code: `GATE-${Math.floor(100000 + Math.random() * 900000)}`,
          valid_from: now.toISOString(),
          valid_until: end.toISOString(),
          status: "active",
          destination: "Vice Chancellor Secretariat - Conference Room 1",
          visitor_name: "Dr. Rajesh Vaidya",
        });
      }
      if (sample2?.id) {
        const now = new Date();
        const end = new Date();
        end.setHours(end.getHours() + 4);
        await createPass.mutateAsync({
          visitor_id: sample2.id,
          purpose: "vendor",
          pass_code: `GATE-${Math.floor(100000 + Math.random() * 900000)}`,
          valid_from: now.toISOString(),
          valid_until: end.toISOString(),
          status: "active",
          destination: "Central IT & Data Center Block",
          visitor_name: "Vikram Solutions",
        });
      }

      toast.success("✨ Sample security data loaded successfully!");
    } catch (err: any) {
      toast.error("Sample seeding finished or visitors already existed!");
    }
  };

  // Filter logic
  const filteredVisitors = visitorsList.filter((v) => {
    const name = String(v.full_name ?? v.name ?? "").toLowerCase();
    const phone = String(v.phone ?? "").toLowerCase();
    const email = String(v.email ?? "").toLowerCase();
    const matchSearch =
      !searchTerm || name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm) || email.includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const filteredPasses = passesList.filter((p) => {
    const code = String(p.pass_code ?? "").toLowerCase();
    const name = String(p.visitors?.full_name ?? "").toLowerCase();
    const matchSearch = !searchTerm || code.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
    const matchPurpose = purposeFilter === "all" || p.purpose === purposeFilter;
    return matchSearch && matchPurpose;
  });

  const getPurposeColor = (p?: string) => {
    switch (p) {
      case "official":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "vendor":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "interview":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "delivery":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <Can permission="visitor.view" fallback={<p className="p-8 text-muted-foreground">Access denied to security hub.</p>}>
      <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
        {/* SaaS Enterprise Banner */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-primary/15 via-blue-500/5 to-transparent blur-3xl" />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5 fill-current" /> Security Gate Checkpoints Operational
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-300">
                  ✨ Live RFID & Audit Sync
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Visitor & Gate Pass Hub 🛡️
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Track external campus visits, maintain verified identity registries, and enforce real-time digital gate pass clearances across institute gates and department wings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {totalVisitors === 0 && !visitorsQuery.isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSeedData}
                  className="h-11 px-4 rounded-[14px] font-semibold text-sm border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-2"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Load Sample Visitors</span>
                </Button>
              )}

              {/* Register Visitor Trigger */}
              <Dialog open={isAddVisitorOpen} onOpenChange={setIsAddVisitorOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 px-5 rounded-[14px] font-bold text-sm gap-2 bg-card hover:bg-muted/50 border-border/80 shadow-xs">
                    <Plus className="size-4 text-primary" />
                    <span>Register Visitor</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[20px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <UserCheck className="size-5 text-primary" /> Register New Visitor
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Add a verified identity to the campus visitor database for streamlined gate pass issuance.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateVisitor} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Full Name / Company Name *
                      </Label>
                      <Input
                        id="full_name"
                        required
                        placeholder="e.g. Dr. Rajesh Vaidya or Tech Solutions Ltd"
                        value={newVisitor.full_name}
                        onChange={(e) => setNewVisitor({ ...newVisitor, full_name: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          required
                          placeholder="+91 9876543210"
                          value={newVisitor.phone}
                          onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                          className="rounded-[12px] h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="id_proof" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          ID Proof Type
                        </Label>
                        <Select
                          value={newVisitor.id_proof_type}
                          onValueChange={(val) => setNewVisitor({ ...newVisitor, id_proof_type: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                            <SelectItem value="PAN Card">PAN Card</SelectItem>
                            <SelectItem value="Driving License">Driving License</SelectItem>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="Company ID">Company ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="id_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ID Proof Number (Optional)
                      </Label>
                      <Input
                        id="id_number"
                        placeholder="e.g. XXXX-XXXX-4892"
                        value={newVisitor.id_proof_number}
                        onChange={(e) => setNewVisitor({ ...newVisitor, id_proof_number: e.target.value })}
                        className="rounded-[12px] h-11 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Email Address (Optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="visitor@organization.com"
                        value={newVisitor.email}
                        onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsAddVisitorOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createVisitor.isPending} className="rounded-[12px] font-bold px-6">
                        {createVisitor.isPending ? "Registering..." : "Register & Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Issue Gate Pass Trigger */}
              <Dialog open={isIssuePassOpen} onOpenChange={setIsIssuePassOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Ticket className="size-4" />
                    <span>Issue Gate Pass</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[22px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" /> Generate Digital Gate Pass
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Issue a time-stamped entry clearance pass. This event will be recorded in Campus Security Incidents and Audit logs.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePass} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="visitor_select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Select Registered Visitor *
                      </Label>
                      <Select
                        value={newPass.visitor_id}
                        onValueChange={(val) => setNewPass({ ...newPass, visitor_id: val })}
                      >
                        <SelectTrigger className="rounded-[12px] h-11">
                          <SelectValue placeholder="Select visitor identity from database..." />
                        </SelectTrigger>
                        <SelectContent>
                          {visitorsList.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No visitors registered yet. Please register first!
                            </SelectItem>
                          ) : (
                            visitorsList.map((vis) => (
                              <SelectItem key={String(vis.id)} value={String(vis.id)}>
                                {String(vis.full_name ?? vis.name)} ({String(vis.phone)})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Visit Purpose *
                        </Label>
                        <Select
                          value={newPass.purpose}
                          onValueChange={(val) => setNewPass({ ...newPass, purpose: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11 capitalize font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="official">Official / Inspection</SelectItem>
                            <SelectItem value="vendor">Vendor / Contractor</SelectItem>
                            <SelectItem value="interview">Job / Student Interview</SelectItem>
                            <SelectItem value="delivery">Delivery / Courier</SelectItem>
                            <SelectItem value="personal">Guardian / Personal</SelectItem>
                            <SelectItem value="other">Other Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Gate Pass Code
                        </Label>
                        <div className="relative">
                          <Input
                            readOnly
                            value={newPass.pass_code}
                            className="rounded-[12px] h-11 font-mono font-bold text-primary bg-primary/5 pl-9"
                          />
                          <Ticket className="size-4 text-primary absolute left-3 top-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dest" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Destination Building / Wing *
                      </Label>
                      <Select
                        value={newPass.destination}
                        onValueChange={(val) => setNewPass({ ...newPass, destination: val })}
                      >
                        <SelectTrigger className="rounded-[12px] h-11 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin Block - Secretariat">Admin Block - Secretariat</SelectItem>
                          <SelectItem value="Vice Chancellor Conference Hall">Vice Chancellor Conference Hall</SelectItem>
                          <SelectItem value="Academic Wing A - Engineering">Academic Wing A - Engineering</SelectItem>
                          <SelectItem value="Central IT & Server Room">Central IT & Server Room</SelectItem>
                          <SelectItem value="University Central Library">University Central Library</SelectItem>
                          <SelectItem value="Main Gate - Reception Waiting Hall">Main Gate - Reception Waiting Hall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-[14px] bg-muted/50 border border-border p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
                      <Lock className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground">Live Security & Timeline Sync:</span> Issuing this gate pass will automatically log an entry inside the Security Incidents Ledger and index the visitor for real-time search (⌘K).
                      </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsIssuePassOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPass.isPending || !newPass.visitor_id} className="rounded-[12px] font-extrabold px-6 shadow-sm">
                        {createPass.isPending ? "Issuing Pass..." : "Issue & Authorize Pass"}
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
          <StatCard
            label="Total Registered Guests"
            value={totalVisitors}
            icon={UsersRound}
            hint="Verified campus identities"
          />
          <StatCard
            label="Active Gate Passes"
            value={activePasses}
            icon={ShieldCheck}
            hint="Current cleared presence"
          />
          <StatCard
            label="Today's Gate Entries"
            value={todayPasses}
            icon={Clock}
            hint="Logged across checkpoints"
          />
          <StatCard
            label="Security Audit Sync"
            value="100%"
            icon={Lock}
            hint="Real-time incident ledger"
          />
        </div>

        {/* Main Workspace Tabs & Data Section */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <TabsList className="h-12 bg-muted/70 p-1 rounded-[16px] border border-border/60">
                <TabsTrigger
                  value="visitors"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Registered Visitors ({totalVisitors})
                </TabsTrigger>
                <TabsTrigger
                  value="passes"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Active Gate Passes ({activePasses})
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-primary transition-all"
                >
                  Security Entry Logs
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or pass code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-[14px] bg-card/90 border-border shadow-2xs text-xs font-medium focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                {activeTab === "passes" && (
                  <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                    <SelectTrigger className="h-10 rounded-[14px] px-3 font-bold text-xs uppercase tracking-wider bg-card border-border w-40">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Purposes</SelectItem>
                      <SelectItem value="official">Official</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* TAB 1: REGISTERED VISITORS */}
            <TabsContent value="visitors" className="pt-4 focus:outline-none">
              {visitorsQuery.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold uppercase font-mono">Loading visitor database...</span>
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-[24px] border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  <UserCheck className="size-12 text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">No Registered Visitors Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    {searchTerm ? "No visitor matches your active search term." : "Your campus visitor database is currently empty. Add your first visitor identity to get started."}
                  </p>
                  {!searchTerm && (
                    <div className="flex items-center gap-3">
                      <Button onClick={() => setIsAddVisitorOpen(true)} className="rounded-[12px] font-bold text-xs px-5 h-10 gap-2">
                        <Plus className="size-4" /> Register First Visitor
                      </Button>
                      <Button variant="outline" onClick={handleSeedData} className="rounded-[12px] font-semibold text-xs px-4 h-10 gap-2">
                        <Sparkles className="size-3.5 text-amber-500" /> Load Sample Data
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVisitors.map((vis, index) => (
                    <Card key={String(vis.id ?? index)} className="group rounded-[20px] border border-border bg-card shadow-xs hover:shadow-md transition-all">
                      <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {String(vis.full_name ?? vis.name ?? "Unknown Identity")}
                          </h4>
                          <p className="text-xs font-mono font-medium text-muted-foreground mt-0.5">
                            📞 {String(vis.phone ?? "No contact recorded")}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-muted/60 font-mono text-[10px] uppercase font-bold text-foreground/80 shrink-0">
                          {String(vis.id_proof_type ?? "Identity Verified")}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-5 pt-2 flex items-center justify-between border-t border-border/50 mt-3 text-xs">
                        <span className="text-muted-foreground font-medium">
                          ID: <strong className="font-mono text-foreground/90">{String(vis.id_proof_number ?? "Verified")}</strong>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewPass({
                              ...newPass,
                              visitor_id: String(vis.id),
                              pass_code: `GATE-${Math.floor(100000 + Math.random() * 900000)}`,
                            });
                            setIsIssuePassOpen(true);
                          }}
                          className="h-8 px-3 rounded-[10px] font-bold text-primary hover:bg-primary/10 gap-1"
                        >
                          <Ticket className="size-3.5" />
                          <span>Issue Pass</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: ACTIVE GATE PASSES */}
            <TabsContent value="passes" className="pt-4 focus:outline-none">
              {passesQuery.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold uppercase font-mono">Syncing active gate passes...</span>
                </div>
              ) : filteredPasses.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-[24px] border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  <Ticket className="size-12 text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">No Active Gate Passes</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    No active visitor passes found matching your criteria. Issue a digital pass to clear visitors at campus security checkpoints.
                  </p>
                  <Button onClick={() => setIsIssuePassOpen(true)} className="rounded-[12px] font-extrabold text-xs px-5 h-10 gap-2 shadow-sm">
                    <Ticket className="size-4" /> Generate Gate Pass
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPasses.map((pass, index) => {
                    const visitorName = String(pass.visitors?.full_name ?? "Guest Visitor");
                    const phone = String(pass.visitors?.phone ?? "");
                    const isExpired = pass.status !== "active";

                    return (
                      <Card
                        key={String(pass.id ?? index)}
                        className={`group rounded-[22px] border transition-all overflow-hidden bg-card ${isExpired ? "border-border/60 opacity-80" : "border-primary/30 shadow-xs hover:shadow-md hover:border-primary"}`}
                      >
                        <div className={`h-1.5 w-full ${isExpired ? "bg-muted-foreground/30" : "bg-linear-to-r from-emerald-500 to-primary"}`} />
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary border border-primary/20 tracking-wider">
                              {String(pass.pass_code ?? "PASS-XXXX")}
                            </span>
                            <Badge className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${getPurposeColor(pass.purpose)}`}>
                              {String(pass.purpose ?? "official")}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-lg text-foreground tracking-tight flex items-center justify-between">
                            <span className="truncate">{visitorName}</span>
                            <CheckCircle2 className={`size-4 ${isExpired ? "text-muted-foreground" : "text-emerald-500"}`} />
                          </h4>
                          <p className="text-xs font-mono text-muted-foreground">📞 {phone || "Registered Guest"}</p>
                        </CardHeader>

                        <CardContent className="p-5 pt-2 space-y-4">
                          <div className="rounded-[12px] bg-muted/40 border border-border/70 p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-muted-foreground">Destination:</span>
                              <span className="font-bold text-foreground truncate max-w-[180px]">{String(pass.destination ?? "Admin Block")}</span>
                            </div>
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-muted-foreground">Valid From:</span>
                              <span className="font-mono text-foreground/90">
                                {pass.valid_from ? format(new Date(String(pass.valid_from)), "dd MMM, HH:mm") : "Today"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/60">
                            <Badge variant="outline" className={`rounded-full font-mono text-[10px] uppercase ${isExpired ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"}`}>
                              ● {String(pass.status ?? "active")}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPassForBadge(pass)}
                              className="h-8 px-3 rounded-[10px] font-bold text-xs gap-1.5 border-primary/30 hover:bg-primary/10 text-primary transition-all"
                            >
                              <QrCode className="size-3.5" />
                              <span>View Badge</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: SECURITY ENTRY LOGS */}
            <TabsContent value="logs" className="pt-4 focus:outline-none">
              <Card className="rounded-[22px] border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6 border-b border-border/70 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Campus Security Checkpoint Ledger</h3>
                    <p className="text-xs text-muted-foreground">Real-time audit log of all gate passes checked in across institutional perimeter portals.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs uppercase font-bold px-3 py-1 bg-primary/5 text-primary border-primary/20">
                    🔒 Immutable Security Log
                  </Badge>
                </div>

                {passesList.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">No recent check-in events logged at gates today.</p>
                ) : (
                  <div className="space-y-3">
                    {passesList.map((p, idx) => (
                      <div key={String(p.id ?? idx)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-[16px] border border-border/80 bg-muted/20 hover:bg-muted/50 transition-colors gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs shrink-0 border border-primary/20">
                            GATE
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">{String(p.visitors?.full_name ?? "Verified Guest")}</span>
                              <span className="font-mono text-xs text-muted-foreground">({String(p.pass_code ?? "PASS")})</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Building2 className="size-3 text-primary" /> Destination: <strong className="text-foreground/90">{String(p.destination ?? "Administration Wing")}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-xs font-mono text-muted-foreground bg-card px-3 py-1 rounded-lg border border-border/70 shadow-2xs">
                            🕒 {p.created_at ? format(new Date(String(p.created_at)), "dd MMM yyyy · HH:mm:ss") : "Just now"}
                          </span>
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px] font-mono uppercase font-extrabold px-2 py-0.5">
                            CLEARED
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Digital Gate Pass Badge Modal (Simulation) */}
        <Dialog open={!!selectedPassForBadge} onOpenChange={(open) => !open && setSelectedPassForBadge(null)}>
          <DialogContent className="sm:max-w-md rounded-[26px] p-0 overflow-hidden bg-card border border-border shadow-2xl">
            <div className="bg-linear-to-r from-slate-900 via-primary to-slate-900 text-white p-6 pb-8 text-center relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="relative z-10 space-y-1">
                <p className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  Northgate Institute of Technology · Gate Security
                </p>
                <h3 className="text-xl font-extrabold uppercase tracking-tight">Digital Visitor Gate Pass</h3>
                <p className="text-xs font-mono opacity-80 pt-1">Authorized Perimeter Access Clearance</p>
              </div>
            </div>

            <div className="-mt-4 mx-6 p-6 rounded-[22px] bg-card border border-border shadow-lg relative z-20 space-y-5 text-center">
              <div className="space-y-1">
                <span className="font-mono text-xs font-black px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 uppercase">
                  {String(selectedPassForBadge?.pass_code ?? "GATE-XXXX")}
                </span>
                <h4 className="text-2xl font-extrabold text-foreground pt-2">
                  {String(selectedPassForBadge?.visitors?.full_name ?? "Registered Visitor")}
                </h4>
                <p className="text-xs text-muted-foreground font-mono">
                  📞 {String(selectedPassForBadge?.visitors?.phone ?? "Identity Cleared")}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border/80 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purpose of Visit:</span>
                  <strong className="font-semibold text-foreground uppercase">{String(selectedPassForBadge?.purpose ?? "Official")}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authorized Destination:</span>
                  <strong className="font-bold text-primary">{String(selectedPassForBadge?.destination ?? "Admin Block")}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Checkpoint Status:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono px-2 py-0">ACTIVE CLEARANCE</Badge>
                </div>
              </div>

              {/* Simulated QR Code for scanner verification */}
              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-2 shadow-2xs">
                <QrCode className="size-32 text-foreground stroke-[1.2] p-2 bg-muted/30 rounded-xl" />
                <span className="text-[10px] font-mono text-muted-foreground">Scan at Gate Security terminal for check-in confirmation</span>
              </div>
            </div>

            <div className="p-6 bg-muted/30 flex items-center justify-between border-t border-border mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPassForBadge(null)}
                className="rounded-[14px] px-5 font-bold text-xs"
              >
                Close Badge
              </Button>
              <Button
                type="button"
                onClick={() => {
                  toast.success(`🖨️ Transmitting Digital Badge (${String(selectedPassForBadge?.pass_code)}) to Gate Security terminal printer...`);
                  setSelectedPassForBadge(null);
                }}
                className="rounded-[14px] px-5 font-bold text-xs gap-2 shadow-sm"
              >
                <Printer className="size-4" />
                <span>Print Pass & NFC Card</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Can>
  );
}
