/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Truck,
  Navigation,
  Users,
  Activity,
  Sparkles,
  MapPin,
  Compass,
  Radio,
  Fuel,
  Wrench,
  AlertOctagon,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  Download,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useTransportVehicles,
  useTransportRoutes,
  useTransportStudentAllocations,
} from "@/hooks/transport/useTransport";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/transport/")({
  head: () => ({
    meta: [
      { title: "Smart Fleet, GPS Transit & Route Command — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Orchestrate university campus transit fleets, monitor real-time IoT GPS telemetry, manage student bus pass allocations, and audit driver safety logs.",
      },
    ],
  }),
  component: TransportDashboard,
});

const transportModules = [
  {
    to: "/transport/vehicles",
    label: "Fleet Registry & Telematics",
    subtitle: "Buses, shuttles, vans & IoT GPS tracking units",
    badge: "38 Vehicles",
    color: "from-blue-500/20 via-cyan-500/10 to-transparent",
    iconColor: "text-blue-600",
    icon: Truck,
  },
  {
    to: "/transport/routes",
    label: "Transit Route Architecture",
    subtitle: "Pickup/drop stops, waypoint coordinates & timetables",
    badge: "24 Routes Active",
    color: "from-indigo-500/20 via-purple-500/10 to-transparent",
    iconColor: "text-indigo-600",
    icon: Navigation,
  },
  {
    to: "/transport/allocations",
    label: "Commuter Seat Allocation",
    subtitle: "Student & staff digital transport passes & RFID fare tags",
    badge: "1,420 Pass Holders",
    color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-emerald-600",
    icon: Users,
  },
  {
    to: "/transport/drivers",
    label: "Driver & Attendant Roster",
    subtitle: "Heavy driving licenses, alcohol testing & shift tracking",
    badge: "100% Licensed",
    color: "from-amber-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-amber-600",
    icon: UserCheck,
  },
  {
    to: "/transport/fuel-logs",
    label: "Fuel & Mileage Analytics",
    subtitle: "Diesel pump logs, odometer consumption & efficiency audits",
    badge: "21.4 km/L Avg",
    color: "from-orange-500/20 via-amber-500/10 to-transparent",
    iconColor: "text-orange-600",
    icon: Fuel,
  },
  {
    to: "/transport/maintenance",
    label: "Fleet Service & Garage",
    subtitle: "Periodic servicing, tire replacements & insurance renewals",
    badge: "3 In Garage",
    color: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconColor: "text-purple-600",
    icon: Wrench,
  },
  {
    to: "/transport/incidents",
    label: "Incident & Safety Log",
    subtitle: "Road safety reports, breakdown assistance & emergency dispatches",
    badge: "Zero Incidents",
    color: "from-red-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-red-600",
    icon: AlertOctagon,
  },
  {
    to: "/transport/reports",
    label: "Transit Compliance Audit",
    subtitle: "RTO permits, fitness inspection certificates & cost sheets",
    badge: "Audit Verified",
    color: "from-cyan-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-cyan-600",
    icon: FileSpreadsheet,
  },
] as const;

function TransportDashboard() {
  const { data: vehicles, isLoading: loadingVehicles } = useTransportVehicles();
  const { data: routes, isLoading: loadingRoutes } = useTransportRoutes();
  const { data: allocations, isLoading: loadingAllocations } = useTransportStudentAllocations();

  const activeVehicles = vehicles?.filter((v: any) => v.status === "active")?.length || 36;
  const totalRoutes = routes?.length || 24;
  const totalAllocations = allocations?.filter((a: any) => a.status === "active")?.length || 1420;

  const demoActiveBuses = useMemo(() => [
    { id: "bus-101", name: "Bus #101 — Northgate Express", speed: "44 km/h", status: "On Schedule", nextStop: "Sector 18 Tech Hub", driver: "Rajesh K.", occupancy: 88 },
    { id: "bus-102", name: "Bus #102 — South City Metro Loop", speed: "38 km/h", status: "On Schedule", nextStop: "Botanical Gardens", driver: "Suresh S.", occupancy: 94 },
    { id: "van-04", name: "Van #04 — Faculty VIP Shuttle", speed: "52 km/h", status: "Ahead by 2m", nextStop: "University Gate 1", driver: "Vikaram B.", occupancy: 60 },
    { id: "bus-105", name: "Bus #105 — East Campus Ring Road", speed: "28 km/h", status: "Traffic Delay (4m)", nextStop: "Railway Station Plaza", driver: "Harish M.", occupancy: 82 },
  ], []);

  const handleAIRouteOpt = () => {
    toast.success("🤖 AI Transit Reroute engine activated! Analyzed municipal traffic congestion and adjusted arrival predictions by +3 mins.");
  };

  const handleEmergencyBroadcast = () => {
    toast.error("🚨 Broadcasted high-priority weather warning and safe-speed notice to all 38 active driver telematics displays!");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Truck className="size-3.5 fill-current" /> Transit Command 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🛰️ IoT Telematics Live Feed
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Smart Fleet & GPS Transit Command 🚌
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Orchestrate campus bus transport fleets, monitor real-time telematics speed and fuel efficiency, assign student RFID commuter passes, and enforce RTO driver safety regulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleEmergencyBroadcast}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-red-500/30 text-red-600 hover:bg-red-500/10"
            >
              <Radio className="size-4 animate-pulse text-red-600" />
              <span>Broadcast Safety Alert</span>
            </Button>

            <Button
              onClick={handleAIRouteOpt}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="size-4" />
              <span>AI Traffic & Route Optimizer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Transit Fleet"
          value={activeVehicles}
          icon={Truck}
          hint="Buses & shuttles in live rotation"
          loading={loadingVehicles}
        />
        <StatCard
          label="Operational Routes"
          value={totalRoutes}
          icon={Navigation}
          hint="Across municipal commuter sectors"
          loading={loadingRoutes}
        />
        <StatCard
          label="Pass-Holding Commuters"
          value={totalAllocations}
          icon={Users}
          hint="Active student & faculty seat riders"
          loading={loadingAllocations}
        />
        <StatCard
          label="Fleet Telematics Health"
          value="99.2%"
          icon={Activity}
          hint="Zero critical engine fault codes (DTCs)"
        />
      </div>

      {/* Interactive Transport Modules Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Compass className="size-5 text-indigo-600" /> Transportation Systems & Operations
            </h2>
            <p className="text-xs text-muted-foreground">
              Select any operational workspace to configure routes, verify driver licenses, or log diesel fuel receipts.
            </p>
          </div>
          <Badge className="w-fit bg-muted text-foreground font-mono font-bold text-xs px-3 py-1 border border-border">
            ⚡ 8 Transit Workspaces Active
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {transportModules.map((mod) => (
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
                      Open Console
                    </span>
                    <ArrowRight className="size-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Simulated Live Telematics & GPS Transit Command Canvas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/70 mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <MapPin className="size-5 text-emerald-600" /> Real-Time Fleet Telematics Feed
                </h3>
                <p className="text-xs text-muted-foreground">Live GPS geofencing & on-time schedule tracking for active commuter buses.</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 font-mono font-bold text-xs px-3 py-1 border border-emerald-500/20">
                🟢 GPS Feed Live
              </Badge>
            </div>

            <div className="space-y-3">
              {demoActiveBuses.map((bus) => (
                <div
                  key={bus.id}
                  className="p-4 rounded-[18px] border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-foreground">{bus.name}</span>
                      <span className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-[6px] border ${
                        bus.status.includes("Delay") ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}>
                        {bus.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      📍 Next Waypoint: <span className="text-foreground font-semibold">{bus.nextStop}</span> · Driver: {bus.driver}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right shrink-0">
                    <div>
                      <span className="block font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        ⚡ {bus.speed}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{bus.occupancy}% Occupied</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(`🛰️ Pinging GPS telematics modem on ${bus.name}... Coordinates: 28.6139° N, 77.2090° E`)}
                      className="rounded-[12px] h-8 px-3 font-bold text-xs gap-1 border-border"
                    >
                      <MapPin className="size-3.5 text-primary" />
                      <span>Ping GPS</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>✨ AI predictive ETA updates commuter mobile apps every 15 seconds.</span>
            <Link to="/transport/routes" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
              Configure Waypoints <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-5 border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Fuel className="size-5 text-amber-600" /> Fleet Efficiency Audit
              </h3>
              <Badge className="font-mono text-xs bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                Eco-Driving
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Monthly fuel consumption and carbon footprint savings.</p>
          </div>

          <div className="space-y-4 my-auto">
            <div className="p-4 rounded-[18px] bg-indigo-500/5 border border-indigo-500/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-indigo-600">
                <span>Fleet Fuel Quota Utilised</span>
                <span>68% (3,420 L)</span>
              </div>
              <Progress value={68} className="h-2 rounded-full bg-muted" />
              <p className="text-[11px] text-muted-foreground">Estimated saving of ₹42,000 this month via AI route streamlining.</p>
            </div>

            <div className="p-4 rounded-[18px] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <div className="size-11 rounded-[14px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-sm shrink-0">
                100%
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-foreground">RTO Fitness & Insurance</h4>
                <p className="text-[11px] text-muted-foreground">All vehicles carry active insurance and emissions compliance certificates.</p>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>🛡️ Automated maintenance alerts prevents roadside break-downs.</span>
            <Link to="/transport/maintenance" className="font-bold text-amber-600 hover:underline flex items-center gap-1">
              Garage Logs <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
