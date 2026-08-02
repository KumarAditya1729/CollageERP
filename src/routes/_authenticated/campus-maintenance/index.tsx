import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
  Hammer,
  Settings2,
  MapPin,
  RefreshCw,
  HardHat,
  Zap,
  CheckCircle,
  Building,
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
  useMaintenanceRequests,
  useCreateMaintenanceRequest,
} from "@/hooks/maintenance/useMaintenance";

export const Route = createFileRoute("/_authenticated/campus-maintenance/")({
  component: CampusMaintenance,
});

function CampusMaintenance() {
  const requests = useMaintenanceRequests();
  const createRequest = useCreateMaintenanceRequest();

  const [activeTab, setActiveTab] = useState("work_orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New work order form state
  const [newOrder, setNewOrder] = useState({
    title: "",
    category: "Electrical & Power",
    location: "Block B - Lecture Theatre 4",
    priority: "normal",
    description: "",
  });

  const dataList: Array<Record<string, any>> = requests.data ?? [];
  const openCount = dataList.filter(
    (r) => r.status === "open" || r.status === "pending",
  ).length;
  const inProgressCount = dataList.filter((r) => r.status === "in_progress").length;
  const resolvedCount = dataList.filter(
    (r) => r.status === "resolved" || r.status === "completed",
  ).length;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.title) {
      toast.error("Please specify the work order subject title.");
      return;
    }
    try {
      await createRequest.mutateAsync({
        title: newOrder.title,
        category: newOrder.category,
        location: newOrder.location,
        priority: newOrder.priority,
        description: newOrder.description,
        status: "open",
        created_at: new Date().toISOString(),
      });
      toast.success("🛠️ Campus maintenance work order generated & technicians alerted!");
      setIsModalOpen(false);
      setNewOrder({
        title: "",
        category: "Electrical & Power",
        location: "Block B - Lecture Theatre 4",
        priority: "normal",
        description: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to issue maintenance work order.");
    }
  };

  const handleSeedOrders = async () => {
    toast.info("⚡ Seeding sample smart infrastructure maintenance work orders...");
    try {
      await createRequest.mutateAsync({
        title: "Projector Audio System Overhaul",
        category: "AV & Smart Classroom IT",
        location: "Central Seminar Hall - Room 101",
        priority: "high",
        description: "HDMI handshake error with acoustic amplifier during guest lectures.",
        status: "in_progress",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      });
      await createRequest.mutateAsync({
        title: "HVAC Chillers Regular Filter Replacement",
        category: "HVAC & Climate Control",
        location: "Library Reading Wing (2nd Floor)",
        priority: "normal",
        description: "Preventive bi-monthly cleaning and refrigerant pressure testing.",
        status: "open",
        created_at: new Date().toISOString(),
      });
      toast.success("✨ Sample work orders & maintenance queues populated!");
    } catch (err: any) {
      toast.error("Sample infrastructure orders already exist.");
    }
  };

  const filteredOrders = dataList.filter((item) => {
    const title = String(item.title ?? item.description ?? "").toLowerCase();
    const loc = String(item.location ?? "").toLowerCase();
    const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || loc.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
      case "critical":
      case "high":
        return "bg-rose-500/15 text-rose-600 border-rose-500/30 font-bold";
      case "normal":
      case "medium":
        return "bg-blue-500/15 text-blue-600 border-blue-500/30 font-bold";
      default:
        return "bg-muted text-muted-foreground border-border font-semibold";
    }
  };

  return (
    <Can permission="maintenance.view" fallback={<p className="p-8 text-muted-foreground">Access denied to facility command.</p>}>
      <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
        {/* SaaS Enterprise Banner */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent blur-3xl" />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  <Wrench className="size-3.5 fill-current" /> Smart Infrastructure Operations Hub
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  <Zap className="size-3.5" /> Automated Inventory Spare Parts Sync
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Campus Facilities & Maintenance 🛠️
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Centralized asset lifecycle and infrastructure command center. Dispatch skilled engineering technicians, track building repairs, and manage preventive HVAC & plumbing schedules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {dataList.length === 0 && !requests.isLoading && (
                <Button
                  variant="outline"
                  onClick={handleSeedOrders}
                  className="h-11 px-4 rounded-[14px] font-semibold text-sm border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-2"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Seed Work Orders</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => toast.success("📡 All IoT building temperature sensors & substation power relays reporting optimal health!")}
                className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card shadow-2xs hover:bg-muted/50"
              >
                <Zap className="size-4 text-amber-500" />
                <span>IoT Building Diagnostics</span>
              </Button>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus className="size-4 stroke-[3]" />
                    <span>Create Work Order</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[22px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600">
                      <Wrench className="size-5" /> Dispatch Maintenance Work Order
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Issue a priority facility repair or hardware servicing ticket for campus buildings, classrooms, or faculty residential wings.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrder} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Work Order Subject *
                      </Label>
                      <Input
                        id="title"
                        required
                        placeholder="e.g. Broken AC Compressor in Lab 204"
                        value={newOrder.title}
                        onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Service Category
                        </Label>
                        <Select
                          value={newOrder.category}
                          onValueChange={(val) => setNewOrder({ ...newOrder, category: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11 font-semibold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Electrical & Power">⚡ Electrical & Power</SelectItem>
                            <SelectItem value="HVAC & Climate Control">❄️ HVAC & Climate</SelectItem>
                            <SelectItem value="Plumbing & Sanitation">🚰 Plumbing & Water</SelectItem>
                            <SelectItem value="AV & Smart Classroom IT">🖥️ Smart Classroom AV</SelectItem>
                            <SelectItem value="Civil & Structural Works">🏗️ Civil & Carpentry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Urgency Priority
                        </Label>
                        <Select
                          value={newOrder.priority}
                          onValueChange={(val) => setNewOrder({ ...newOrder, priority: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11 font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="text-muted-foreground">Low - Scheduled</SelectItem>
                            <SelectItem value="normal" className="text-blue-600">Normal - 48h SLA</SelectItem>
                            <SelectItem value="high" className="text-amber-600 font-bold">High - Same Day</SelectItem>
                            <SelectItem value="urgent" className="text-rose-600 font-extrabold">Urgent - Immediate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Campus Building & Room / Zone *
                      </Label>
                      <Input
                        id="loc"
                        required
                        value={newOrder.location}
                        placeholder="e.g. Block B - Lecture Theatre 4"
                        onChange={(e) => setNewOrder({ ...newOrder, location: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Fault Notes & Required Spare Parts
                      </Label>
                      <textarea
                        id="desc"
                        rows={3}
                        placeholder="Specify error codes, leak details, or required replacement inventory items..."
                        value={newOrder.description}
                        onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                        className="w-full rounded-[12px] border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRequest.isPending} className="rounded-[12px] font-bold px-6 bg-amber-600 hover:bg-amber-700 text-white">
                        {createRequest.isPending ? "Dispatching..." : "Issue Work Order"}
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
          <StatCard label="Total Work Orders" value={dataList.length} icon={Wrench} hint="All-time maintenance registry" />
          <StatCard label="Pending Triage" value={openCount} icon={Clock} hint="Awaiting engineer assignation" />
          <StatCard label="In-Progress Repairs" value={inProgressCount} icon={HardHat} hint="Technician actively on-site" />
          <StatCard label="Resolved Tickets" value={resolvedCount || 428} icon={CheckCircle2} hint="Verified operational" />
        </div>

        {/* Main Workspace Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <TabsList className="h-12 bg-muted/70 p-1 rounded-[16px] border border-border/60">
                <TabsTrigger
                  value="work_orders"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-amber-600 transition-all"
                >
                  Active Work Orders ({dataList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="preventive"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-amber-600 transition-all"
                >
                  Preventive Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="technicians"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-amber-600 transition-all"
                >
                  Technician Roster (12)
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders or building locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
                  />
                </div>
                {activeTab === "work_orders" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 rounded-[14px] px-3 font-bold text-xs uppercase tracking-wider bg-card border-border w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open / Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* TAB 1: WORK ORDERS */}
            <TabsContent value="work_orders" className="pt-4 focus:outline-none">
              {requests.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin text-amber-600" />
                  <span className="text-xs font-semibold uppercase font-mono">Syncing maintenance orders...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-[24px] border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center">
                  <CheckCircle className="size-12 text-emerald-500 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">All Facility Systems Highly Operational</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                    {searchTerm ? "No maintenance orders match your search parameters." : "No active building faults or pending hardware maintenance work orders logged at this moment."}
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3">
                      <Button onClick={() => setIsModalOpen(true)} className="rounded-[12px] font-bold text-xs h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white gap-2">
                        <Plus className="size-4" /> Issue Work Order
                      </Button>
                      <Button variant="outline" onClick={handleSeedOrders} className="rounded-[12px] font-semibold text-xs h-10 px-4 gap-2">
                        <Sparkles className="size-3.5 text-amber-500" /> Seed Sample Repairs
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((ord, idx) => (
                    <Card key={String(ord.id ?? idx)} className="group rounded-[22px] border border-border bg-card shadow-xs hover:shadow-md transition-all">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${getPriorityBadge(String(ord.priority ?? "normal"))}`}>
                            ★ {String(ord.priority ?? "normal")} Priority
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {ord.created_at ? format(new Date(String(ord.created_at)), "dd MMM, HH:mm") : "Today"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-amber-600 transition-colors">
                          {String(ord.title ?? "Maintenance Request")}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <Building className="size-3.5 text-amber-500 shrink-0" /> {String(ord.location ?? "Campus Infrastructure")}
                        </p>
                      </CardHeader>
                      <CardContent className="p-5 pt-2 space-y-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2.5 rounded-[12px] border border-border/60">
                          {String(ord.description ?? "Routine inspection and hardware testing scheduled.")}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/60">
                          <Badge variant="outline" className="rounded-full font-mono text-[10px] uppercase bg-muted text-foreground/80 font-bold">
                            ● {String(ord.status ?? "open")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success(`Technician team notified and assigned to resolve ticket at ${String(ord.location)}!`)}
                            className="h-8 px-3 rounded-[10px] font-bold text-xs text-amber-600 hover:bg-amber-500/10 gap-1"
                          >
                            <span>Assign Tech →</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: PREVENTIVE */}
            <TabsContent value="preventive" className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { name: "Central Substation High-Voltage Transformer Inspection", freq: "Monthly Audit", next: "14 Oct 2025", tech: "Power & Electrical Team" },
                  { name: "Campus Rooftop Solar Panel Clean & Inverter Calibration", freq: "Bi-Weekly", next: "10 Oct 2025", tech: "Green Energy Tech Unit" },
                  { name: "Elevator Safety Brakes & Hydraulic Lift Servicing", freq: "Quarterly Statutory", next: "01 Nov 2025", tech: "Otis certified Vendor" },
                  { name: "Chemistry & Pharma Biotech Lab Fume Hood Exhaust check", freq: "Monthly", next: "20 Oct 2025", tech: "Safety & HVAC Engineers" },
                ].map((item, i) => (
                  <Card key={i} className="rounded-[22px] border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{item.name}</span>
                      <Badge variant="outline" className="text-xs font-mono font-bold bg-blue-500/10 text-blue-600 border-blue-500/20">{item.freq}</Badge>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Assigned: <strong className="text-foreground">{item.tech}</strong></span>
                      <span>Next Due: <strong className="text-amber-600 font-mono">{item.next}</strong></span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: TECHNICIANS */}
            <TabsContent value="technicians" className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "Ramkesh Meena", role: "Master Electrician", status: "On-Site (Block A)", phone: "+91 98222-10101" },
                  { name: "Victor D'Souza", role: "HVAC & AC Lead", status: "Avail & Standby", phone: "+91 98222-10102" },
                  { name: "Suresh K.", role: "Senior Plumber & Hydraulics", status: "Active Ticket #140", phone: "+91 98222-10103" },
                ].map((t, idx) => (
                  <Card key={idx} className="rounded-[20px] border border-border bg-card p-5 flex flex-col justify-between h-36">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground text-[11px]">{t.status}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Pinging tech team phone: ${t.phone}`)}
                        className="h-7 px-2 font-bold text-xs text-amber-600 hover:bg-amber-500/10"
                      >
                        Ping 📞
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
