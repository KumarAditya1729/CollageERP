/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BedDouble,
  Building2,
  Users,
  Wrench,
  Sparkles,
  Utensils,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  UserCheck,
  ArrowRight,
  Check,
  X,
  Calendar,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useHostels,
  useHostelRooms,
  useHostelAllocations,
  useHostelComplaints,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/")({
  head: () => ({
    meta: [
      { title: "Smart Dormitory, Mess & Campus Living Command — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Manage residential dormitories, allocate student rooms, curate mess dining menus, and process automated student outing gate passes.",
      },
    ],
  }),
  component: HostelDashboard,
});

const hostelModules = [
  {
    to: "/hostel/buildings",
    label: "Dormitory Properties & Blocks",
    subtitle: "Men's, women's & faculty residential apartments & blocks",
    badge: "12 Hostels",
    color: "from-blue-500/20 via-indigo-500/10 to-transparent",
    iconColor: "text-blue-600",
    icon: Building2,
  },
  {
    to: "/hostel/rooms",
    label: "Room & Bed Inventory",
    subtitle: "Single AC, twin-sharing cubicles & dormitory bed allocations",
    badge: "1,850 Beds",
    color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-emerald-600",
    icon: BedDouble,
  },
  {
    to: "/hostel/allocations",
    label: "Resident Room Reservations",
    subtitle: "Academic semester housing allotments and roommate mapping",
    badge: "92% Occupied",
    color: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconColor: "text-purple-600",
    icon: Users,
  },
  {
    to: "/hostel/mess",
    label: "Mess Dining & Nutrition",
    subtitle: "Daily breakfast, lunch & dinner nutritional meal planners",
    badge: "Healthy Diet",
    color: "from-orange-500/20 via-amber-500/10 to-transparent",
    iconColor: "text-orange-600",
    icon: Utensils,
  },
  {
    to: "/hostel/gate-pass",
    label: "Student Outing Gate-Passes",
    subtitle: "Automated parent OTP consent & evening curfew exit permits",
    badge: "4 Pending",
    color: "from-amber-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-amber-600",
    icon: KeyRound,
  },
  {
    to: "/hostel/visitors",
    label: "Visitor Security Registry",
    subtitle: "Biometric visitor check-ins & hostel lounge meeting permits",
    badge: "Security Live",
    color: "from-cyan-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-cyan-600",
    icon: ShieldCheck,
  },
  {
    to: "/hostel/complaints",
    label: "Facility Maintenance Helpdesk",
    subtitle: "Plumbing, Wi-Fi, carpentry and cleaning request tickets",
    badge: "2 Active Tickets",
    color: "from-red-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-red-600",
    icon: Wrench,
  },
  {
    to: "/hostel/attendance",
    label: "Night Curfew Biometric Call",
    subtitle: "10:00 PM automated facial recognition dormitory roll call",
    badge: "99.4% Present",
    color: "from-indigo-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-indigo-600",
    icon: UserCheck,
  },
] as const;

function HostelDashboard() {
  const { data: hostels, isLoading: loadingHostels } = useHostels();
  const { data: rooms, isLoading: loadingRooms } = useHostelRooms();
  const { data: allocations, isLoading: loadingAllocations } = useHostelAllocations();
  const { data: complaints, isLoading: loadingComplaints } = useHostelComplaints();

  const totalHostels = hostels?.length || 12;
  const totalRooms = rooms?.length || 680;
  const totalCapacity = hostels?.reduce((sum: number, h: any) => sum + (h.total_capacity || 0), 0) || 1850;
  const activeAllocations = allocations?.filter((a: any) => a.status !== "vacated")?.length || 1710;
  const openComplaints = complaints?.filter((c: any) => c.status === "open")?.length || 2;

  const [demoGatePasses, setDemoGatePasses] = useState([
    { id: "gp-1", student: "Rohan Sharma (CS-B2)", destination: "Weekend Family Visit — New Delhi", parentConsent: "Verified via OTP", time: "Leaving Fri 5:00 PM", status: "pending" },
    { id: "gp-2", student: "Ananya Iyer (AI-A1)", destination: "Hackathon at IIT Delhi (Group of 4)", parentConsent: "Parent letter on file", time: "Leaving Sat 7:00 AM", status: "pending" },
    { id: "gp-3", student: "Vikram Singh (Mech)", destination: "Medical Dental Appointment (City Plaza)", parentConsent: "Warden pre-approved", time: "Returning today 8:30 PM", status: "approved" },
  ]);

  const handleApproveGatePass = (id: string, name: string) => {
    setDemoGatePasses((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));
    toast.success(`✅ Gate-pass exit permit approved for ${name}. QR digital exit code dispatched to student & security gate app!`);
  };

  const handleRejectGatePass = (id: string, name: string) => {
    setDemoGatePasses((prev) => prev.map((p) => p.id === id ? { ...p, status: "denied" } : p));
    toast.error(`❌ Denied gate-pass for ${name}. Notification sent to student explaining campus curfew guidelines.`);
  };

  const handleAIRoommateMatch = () => {
    toast.success("🤖 AI Compatibility Roommate Matcher completed! Optimized room assignments based on study hours, sleep schedule, and branch of study.");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                <Building2 className="size-3.5 fill-current" /> Campus Living 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                🔐 Automated Gate-Pass Engine
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Smart Dormitories, Mess & Campus Living 🏢
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Orchestrate campus dormitories and residential life, supervise nutritious mess dining menus, process biometric curfew roll calls, and automate student outing exit permits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.info("🌙 Triggering 10:00 PM Biometric Facial Recognition dormitory curfew roll call across all 12 hostel entry towers.")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Lock className="size-4 text-indigo-600" />
              <span>Trigger Night Curfew Roll Call</span>
            </Button>

            <Button
              onClick={handleAIRoommateMatch}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="size-4" />
              <span>AI Roommate Compatibility Matcher</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Managed Residences" value={totalHostels} icon={Building2} hint="Hostels & dorm blocks" loading={loadingHostels} />
        <StatCard label="Total Rooms & Cubicles" value={totalRooms} icon={BedDouble} hint="Ac & non-AC living units" loading={loadingRooms} />
        <StatCard
          label="Dormitory Occupancy"
          value={`${activeAllocations} / ${totalCapacity}`}
          icon={Users}
          hint={`${totalCapacity > 0 ? Math.round((activeAllocations / totalCapacity) * 100) : 92}% beds reserved`}
          loading={loadingAllocations}
        />
        <StatCard label="Maintenance Tickets" value={openComplaints} icon={Wrench} hint="Active plumber/electrician calls" loading={loadingComplaints} />
      </div>

      {/* Interactive Hostel Modules Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <ClipboardList className="size-5 text-purple-600" /> Residential & Hospitality Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any operational workspace to configure room types, inspect mess meal cards, or verify gate-passes.
            </p>
          </div>
          <Badge className="w-fit bg-muted text-foreground font-mono font-bold text-xs px-3 py-1 border border-border">
            ⚡ 8 Residential Systems Active
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hostelModules.map((mod) => (
            <Link key={mod.to} to={mod.to}>
              <Card className="h-full rounded-[24px] border border-border bg-card hover:bg-muted/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
                <div className={`absolute inset-0 bg-linear-to-br ${mod.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                <CardContent className="p-6 space-y-4 relative z-10 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-[14px] bg-background border border-border shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                        <mod.icon className={`size-6 ${mod.iconColor}`} />
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] font-extrabold bg-background/80 shadow-2xs border-border/80">
                        {mod.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {mod.label}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-normal leading-relaxed">
                        {mod.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono uppercase text-[11px]">
                      Open Module
                    </span>
                    <ArrowRight className="size-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Simulated Live Gate-Pass & Mess Operations Center */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gate Pass & Outing Authorization Console */}
        <Card className="lg:col-span-2 rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/70 mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <KeyRound className="size-5 text-amber-600" /> Live Gate-Pass & Outing Authorization Queue
                </h3>
                <p className="text-xs text-muted-foreground">Approve student weekend outing requests and verify parent SMS/OTP security consent.</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 font-mono font-bold text-xs px-3 py-1 border border-amber-500/20">
                🟡 Warden Review
              </Badge>
            </div>

            <div className="space-y-3">
              {demoGatePasses.map((gp) => (
                <div
                  key={gp.id}
                  className="p-4 rounded-[18px] border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-foreground">{gp.student}</span>
                      <span className="font-mono text-[10px] bg-background px-2 py-0.5 rounded-[6px] border border-border text-emerald-600 font-bold">
                        {gp.parentConsent}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      🧳 {gp.destination} · <span className="text-foreground font-semibold">{gp.time}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:text-right shrink-0">
                    {gp.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectGatePass(gp.id, gp.student)}
                          className="rounded-[12px] h-9 px-3 font-extrabold text-xs text-red-600 hover:bg-red-500/10 border-border gap-1"
                        >
                          <X className="size-3.5" /> Deny
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveGatePass(gp.id, gp.student)}
                          className="rounded-[12px] h-9 px-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                        >
                          <Check className="size-3.5" /> Approve Pass
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className={`font-mono text-xs px-3 py-1 font-bold ${
                        gp.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                      }`}>
                        {gp.status === "approved" ? "🟢 Approved & QR Sent" : "🔴 Denied Permit"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>✨ Digital QR exit codes expire automatically 30 mins after approved exit window.</span>
            <Link to="/hostel/gate-pass" className="font-bold text-amber-600 hover:underline flex items-center gap-1">
              View All Passes <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>

        {/* Mess Dining & Nutritional Live Overview */}
        <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-5 border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Utensils className="size-5 text-orange-600" /> Today's Mess Dining Menu
              </h3>
              <Badge className="font-mono text-xs bg-orange-500/10 text-orange-600 font-bold border border-orange-500/20">
                FSSAI Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Nutritionally balanced student menu for Friday.</p>
          </div>

          <div className="space-y-4 my-auto">
            <div className="p-3 rounded-[16px] border border-border bg-muted/20 space-y-1">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span className="text-amber-600">🌅 Breakfast (7:30 - 9:30 AM)</span>
                <span className="font-mono text-muted-foreground">640 Cal</span>
              </div>
              <p className="text-xs text-muted-foreground">Idli-Sambar, Coconut Chutney, Masala Omelette / Sprouts, Milk & Coffee.</p>
            </div>

            <div className="p-3 rounded-[16px] border border-border bg-muted/20 space-y-1">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span className="text-emerald-600">☀️ Lunch (12:30 - 2:30 PM)</span>
                <span className="font-mono text-muted-foreground">820 Cal</span>
              </div>
              <p className="text-xs text-muted-foreground">Rajma Rasheedar, Jeera Rice, Chapati, Boondhi Raita, Cucumber Salad & Papad.</p>
            </div>

            <div className="p-3 rounded-[16px] border border-border bg-muted/20 space-y-1">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span className="text-indigo-600">🌙 Dinner (7:30 - 9:30 PM)</span>
                <span className="font-mono text-muted-foreground">780 Cal</span>
              </div>
              <p className="text-xs text-muted-foreground">Paneer Butter Masala / Chicken Curry, Dal Tadka, Tandoori Roti & Kheer.</p>
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>🥗 94.2% student positive feedback on dining quality.</span>
            <Link to="/hostel/mess" className="font-bold text-orange-600 hover:underline flex items-center gap-1">
              Mess Weekly Menu <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
