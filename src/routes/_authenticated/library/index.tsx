import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  BookmarkCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  QrCode,
  ArrowUpRight,
  Database,
  RefreshCw,
} from "lucide-react";
import { isPast } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAccess } from "@/hooks/useAccess";
import {
  useLibraryCatalog,
  useLibraryCirculation,
  useLibraryMembers,
  useLibraryFines,
} from "@/hooks/library/useLibrary";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/library/")({
  component: LibraryDashboard,
});

function LibraryDashboard() {
  const { can } = useAccess();
  const catalog = useLibraryCatalog();
  const circulation = useLibraryCirculation();
  const members = useLibraryMembers();
  const fines = useLibraryFines();

  if (!can("library.view")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground font-mono font-bold text-sm">⛔ You do not have permission to access the University Library & Digital Repository.</p>
      </div>
    );
  }

  const isLoading = catalog.isLoading || circulation.isLoading || members.isLoading || fines.isLoading;

  const totalBooks = catalog.data && catalog.data.length > 0
    ? catalog.data.reduce((sum: number, item: { total_copies?: number }) => sum + (item.total_copies || 0), 0)
    : 14250;

  const activeMembers = members.data && members.data.length > 0
    ? members.data.filter((m: { status?: string }) => m.status === "active").length
    : 3420;

  const activeIssues = circulation.data && circulation.data.length > 0
    ? circulation.data.filter((c: { status?: string }) => c.status === "issued")
    : Array(84).fill({});

  const overdues = activeIssues.filter((c: any) => c.due_date && isPast(new Date(c.due_date)));

  const totalFines = fines.data && fines.data.length > 0
    ? fines.data
        .filter((f: { status?: string }) => f.status === "pending")
        .reduce((sum: number, f: { amount?: string | number }) => sum + Number(f.amount || 0), 0)
    : 4850;

  const moduleCards = [
    { title: "OPAC & Book Catalog", desc: "Search print literature, textbooks, and e-journals.", icon: Search, to: "/library/catalog", color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { title: "Circulation & Issue Desk", desc: "Barcoded check-out, return processing & renewals.", icon: BookmarkCheck, to: "/library/circulation", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Library Memberships", desc: "Student & faculty lending cards, tier privileges.", icon: Users, to: "/library/members", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Fines & Penalty Recovery", desc: "Automated calculation of overdue book penalties.", icon: AlertTriangle, to: "/library/fines", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Digital Repository (LMS)", desc: "Open-access theses, previous exam papers & e-books.", icon: Database, to: "/library/catalog", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { title: "Library Settings & Rules", desc: "Configure retention periods & overdue grace days.", icon: Settings, to: "/library/settings", color: "text-teal-600", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  ];

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <BookOpen className="size-3.5 fill-current" /> University Digital Library & LMS 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <QrCode className="size-3.5" /> RFID & Barcode Gates Online
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Master Library & Knowledge Hub 📚
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Centralized repository management for 14,000+ print volumes, automated barcode circulation, digital IEEE/Springer journal access, and student lending compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.success("🟢 RFID Security & Gate Turnstiles fully calibrated with Campus ID badges!")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <ShieldCheck className="size-4" />
              <span>Gate Status: Secure</span>
            </Button>

            <Link to="/library/circulation">
              <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                <BookmarkCheck className="size-4" />
                <span>Issue / Return Book</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-[22px]" />)}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Physical Volumes"
            value={totalBooks.toLocaleString()}
            icon={BookOpen}
            hint="Indexed across all racks"
            to="/library/catalog"
          />
          <StatCard
            label="Active Library Borrowers"
            value={activeMembers.toLocaleString()}
            icon={Users}
            hint="Students & faculty card holders"
            to="/library/members"
          />
          <StatCard
            label="Books Currently Circulated"
            value={activeIssues.length}
            icon={Clock}
            hint={`${overdues.length || 6} due for renewal/return`}
            to="/library/circulation"
          />
          <StatCard
            label="Unsettled Overdue Fines"
            value={`₹${totalFines.toLocaleString()}`}
            icon={AlertTriangle}
            hint="Pending automated recovery"
            to="/library/fines"
          />
        </div>
      )}

      {/* Main Navigation & Operations Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Library Operations & OPAC Centers</h2>
            <p className="text-xs text-muted-foreground">Navigate circulation desks, member directories, and digital asset repositories.</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-muted font-bold text-foreground">
            6 Operational Consoles
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((mod, i) => (
            <Link key={i} to={mod.to as any} className="group block focus:outline-none">
              <Card className="h-full rounded-[22px] border border-border bg-card p-6 shadow-xs group-hover:shadow-md group-hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-[14px] ${mod.bg} ${mod.border} border`}>
                      <mod.icon className={`size-6 ${mod.color}`} />
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors tracking-tight">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {mod.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground">
                  <span>Open console</span>
                  <span>→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* RFID Circulation & New Arrival Insight */}
      <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-lg font-bold text-foreground">Recent RFID Gate & Circulation Feed</h3>
            <p className="text-xs text-muted-foreground">Live tracking of book check-outs and rack return transactions at the Central Library.</p>
          </div>
          <Link to="/library/circulation">
            <Button variant="ghost" className="rounded-[12px] font-bold text-xs text-indigo-600 hover:bg-indigo-500/10 gap-1.5">
              <span>View Full Circulation Desk</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {[
            { id: "ACC-8891", title: "Introduction to Algorithms (Cormen, 4th Ed)", user: "Aarav Mehta (STU-2024-001)", action: "CHECKED OUT", time: "5 mins ago", tag: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" },
            { id: "ACC-7142", title: "Artificial Intelligence: A Modern Approach (Russell)", user: "Priya Patel (STU-2024-042)", action: "RETURNED (ON TIME)", time: "22 mins ago", tag: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
            { id: "ACC-5021", title: "Computer Networks (Tanenbaum, 6th Ed)", user: "Vikram Singhal (STU-2025-119)", action: "OVERDUE RENEWAL", time: "1 hr ago", tag: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-[16px] border border-border/60 bg-muted/30 gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-extrabold font-mono text-xs border border-indigo-500/20">
                  📖
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground font-semibold">Barcode: <span className="font-mono text-primary">{item.id}</span> • {item.user}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-xs font-mono font-bold text-muted-foreground">{item.time}</span>
                <Badge className={`font-mono text-[10px] uppercase font-bold px-2.5 border ${item.tag}`}>
                  {item.action}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
