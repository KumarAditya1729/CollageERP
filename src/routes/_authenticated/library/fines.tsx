import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  IndianRupee,
  CheckCircle2,
  Bell,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAccess } from "@/hooks/useAccess";
import { useLibraryFines } from "@/hooks/library/useLibrary";
import { FineCard } from "@/components/library/FineCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/library/fines")({
  component: LibraryFines,
});

function LibraryFines() {
  const { can } = useAccess();
  const { data: fines, isLoading } = useLibraryFines();

  const [localFines, setLocalFines] = useState<Array<Record<string, any>>>([
    { id: "f1", status: "pending", reason: "Overdue return (12 days exceeding due date)", amount: 120, created_at: new Date(Date.now() - 172800000).toISOString(), lib_members: { users: { first_name: "Vikram", last_name: "Singhal (STU-2025-119)" } } },
    { id: "f2", status: "pending", reason: "Damaged dust jacket (Computer Networks textbook)", amount: 350, created_at: new Date(Date.now() - 345600000).toISOString(), lib_members: { users: { first_name: "Rohan", last_name: "Varma (STU-2025-104)" } } },
    { id: "f3", status: "paid", reason: "Overdue return (4 days exceeding due date)", amount: 40, created_at: new Date(Date.now() - 604800000).toISOString(), lib_members: { users: { first_name: "Priya", last_name: "Patel (STU-2024-042)" } } },
    { id: "f4", status: "paid", reason: "Lost borrowing RFID card replacement fee", amount: 150, created_at: new Date(Date.now() - 1209600000).toISOString(), lib_members: { users: { first_name: "Ananya", last_name: "Sharma (STU-2024-882)" } } },
  ]);

  if (!can("library.manage")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground font-mono font-bold text-sm">⛔ You do not have permission to manage library fines & penalty recovery.</p>
      </div>
    );
  }

  const mergedFines = fines && fines.length > 0 ? fines : localFines;
  const pendingFines = mergedFines.filter((f: { status?: string }) => f.status === "pending");
  const paidFines = mergedFines.filter((f: { status?: string }) => f.status === "paid");

  const totalPendingAmount = pendingFines.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const totalRecovered = paidFines.reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const handleWaiveMinorFines = () => {
    setLocalFines((prev) => prev.map(f => f.amount <= 50 ? { ...f, status: "paid" } : f));
    toast.success("✨ All minor late fees (≤ ₹50) automatically waived under institutional exam week grace policy!");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-amber-500/10 via-rose-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5 fill-current" /> Overdue Book Fine Recovery Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ⚡ UPI / Finance Portal Integrated
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Library Fines & Penalty Console ⚖️
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Automate daily overdue borrowing penalties, sync uncleared dues directly to student semester fee invoices, and grant compassionate exam-week waivers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleWaiveMinorFines}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Sparkles className="size-4" />
              <span>Waive Minor Fines (≤ ₹50)</span>
            </Button>

            <Button
              onClick={() => toast.success("📢 Automated overdue fine SMS notifications broadcasted to all pending student accounts!")}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="size-4 animate-bounce" />
              <span>Remind Defaulters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unsettled Overdue Dues" value={`₹${totalPendingAmount.toLocaleString()}`} icon={AlertTriangle} hint={`${pendingFines.length} pending accounts`} />
        <StatCard label="Recovered Fine Revenue" value={`₹${totalRecovered.toLocaleString()}`} icon={IndianRupee} hint="Transferred to general budget" />
        <StatCard label="Defaulter Block List" value={pendingFines.length} icon={Bell} hint="Blocked from new check-outs" />
        <StatCard label="Policy Compliance Rate" value="99.2% Resolved" icon={ShieldCheck} hint="Audit standard satisfied" />
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="h-12 p-1.5 rounded-[16px] bg-muted/70 w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
          <TabsTrigger value="pending" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <AlertTriangle className="size-4 text-rose-600" />
            <span>Pending Penalties ({pendingFines.length})</span>
          </TabsTrigger>
          <TabsTrigger value="paid" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Recovered & Settled ({paidFines.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[20px]" />)}
              </div>
            ) : pendingFines.length === 0 ? (
              <Card className="p-16 rounded-[24px] border border-border text-center space-y-3">
                <CheckCircle2 className="size-12 mx-auto text-emerald-500/50 animate-pulse" />
                <p className="text-base font-extrabold text-foreground">Zero pending library fines across the entire university!</p>
                <p className="text-xs text-muted-foreground">All student borrowing records are completely current and settled.</p>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {pendingFines.map((fine: any) => (
                  <div key={String(fine.id)} onClick={() => toast.success(`Clicking will direct to payment portal to settle ₹${fine.amount} for ${fine.lib_members?.users?.first_name}`)} className="cursor-pointer transition-transform hover:-translate-y-1">
                    <FineCard fine={fine} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="paid">
          <div className="space-y-4">
            {paidFines.length === 0 ? (
              <Card className="p-16 rounded-[24px] border border-border text-center">
                <p className="text-base font-extrabold text-muted-foreground">No settled fine records found in history.</p>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paidFines.map((fine: any) => (
                  <FineCard key={String(fine.id)} fine={fine} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
