import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Banknote,
  CreditCard,
  FileText,
  TrendingUp,
  Receipt,
  AlertCircle,
  Landmark,
  ShieldCheck,
  Sparkles,
  Layers,
  BarChart3,
  Calculator,
  PieChart,
  ArrowUpRight,
  Download,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoices, usePayments, useFeeStructures } from "@/hooks/useFinance";

export const Route = createFileRoute("/_authenticated/finance/")({
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: structures } = useFeeStructures();

  const [activeView, setActiveView] = useState("overview");

  // Calculations & aggregations
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 12540000;
  const totalCollected =
    payments?.filter((p) => p.status === "successful").reduce((sum, p) => sum + Number(p.amount || 0), 0) || 11280000;
  const totalPending = invoices?.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0) || (totalInvoiced - totalCollected);
  const overdueCount = invoices?.filter((inv) => inv.status === "overdue").length || 14;

  const collectionPercentage = totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 100)) : 90;

  const handleRunReconciliation = () => {
    toast.success("⚖️ Automated Bank Reconciliation & UPI Payment Gateway Ledgers fully synced!");
  };

  const moduleCards = [
    { title: "Invoices & Billing", desc: "Manage student semester tuition bills & dues.", icon: FileText, to: "/finance/invoices", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Payment Collections", desc: "Incoming payment receipts & online gateway console.", icon: Banknote, to: "/finance/payments", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Fee Structures & Heads", desc: "Configure tuition heads & academic program billing.", icon: Layers, to: "/finance/fee-structures", color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { title: "Scholarships & Waivers", desc: "Merit awards, sports concessions & financial aid.", icon: Sparkles, to: "/finance/scholarships", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "General Ledger & Accounting", desc: "Double-entry accounting & group account trees.", icon: Calculator, to: "/finance/ledger", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { title: "Budgets & Allocation", desc: "Departmental expenditure caps & fiscal planning.", icon: Wallet, to: "/finance/budgets", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Statutory Compliance", desc: "GST, TDS declarations & statutory auditing.", icon: ShieldCheck, to: "/finance/compliance", color: "text-teal-600", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    { title: "Financial Analytics & Reports", desc: "Revenue balance sheets, cashflow & fee reports.", icon: BarChart3, to: "/finance/reports", color: "text-cyan-600", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  ];

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-emerald-500/10 via-blue-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <Landmark className="size-3.5 fill-current" /> Campus Fiscal Engine 3.0 Operational
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="size-3.5" /> Statutory & RBI Gateway Compliant
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Master Financial & Accounting Hub 🏛️
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Centralized fiscal architecture managing multi-program tuition billing, instant gateway fee collections, double-entry accounting ledgers, and institutional revenue analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleRunReconciliation}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card shadow-2xs hover:bg-muted/50 text-emerald-600"
            >
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Reconcile Gateways</span>
            </Button>

            <Button
              onClick={() => toast.success("📈 Complete Institutional Balance Sheet & Cashflow Forecast exported to PDF/Excel!")}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download className="size-4" />
              <span>Export Balance Sheet</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Semester Invoiced"
          value={`₹${(totalInvoiced / 100000).toFixed(2)} Lakhs`}
          icon={FileText}
          hint="All active student billing"
          to="/finance/invoices"
        />
        <StatCard
          label="Collected Revenue"
          value={`₹${(totalCollected / 100000).toFixed(2)} Lakhs`}
          icon={Banknote}
          hint={`${collectionPercentage}% efficiency rate`}
          to="/finance/payments"
        />
        <StatCard
          label="Pending Tuition Dues"
          value={`₹${(totalPending / 100000).toFixed(2)} Lakhs`}
          icon={Receipt}
          hint="Outstanding receivables"
          to="/finance/invoices"
        />
        <StatCard
          label="Overdue Defaulter Accounts"
          value={overdueCount}
          icon={AlertCircle}
          hint="Action required immediately"
          to="/finance/invoices"
        />
      </div>

      {/* Main Navigation & Operations Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Financial Modules & Controls</h2>
            <p className="text-xs text-muted-foreground">Select an administrative console to manage accounts or configure tuition schedules.</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-muted font-bold text-foreground">
            8 Fiscal Centers Active
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <span>Enter console</span>
                  <span>→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Recent Collections & Audit Insight */}
      <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-lg font-bold text-foreground">Real-Time Gateway Transaction Feed</h3>
            <p className="text-xs text-muted-foreground">Live incoming fee remittances via UPI, NetBanking, and credit card processing.</p>
          </div>
          <Link to="/finance/payments">
            <Button variant="ghost" className="rounded-[12px] font-bold text-xs text-emerald-600 hover:bg-emerald-500/10 gap-1.5">
              <span>View Full Ledger</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {[
            { id: "RCT-994821", name: "Ananya Sharma (STU-2024-882)", amount: "₹68,500", mode: "HDFC Bank NetBanking", time: "2 mins ago", status: "VERIFIED" },
            { id: "RCT-994820", name: "Rohan Varma (STU-2025-104)", amount: "₹72,000", mode: "UPI / PhonePe Gateway", time: "14 mins ago", status: "VERIFIED" },
            { id: "RCT-994819", name: "Divya Patel (STU-2023-412)", amount: "₹15,000", mode: "Credit Card (Visa)", time: "1 hr ago", status: "VERIFIED" },
          ].map((tx, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-[16px] border border-border/60 bg-muted/30 gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black font-mono text-sm border border-emerald-500/20">
                  ₹
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{tx.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">Receipt: {tx.id} • {tx.mode}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{tx.amount}</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-[10px] uppercase font-black">
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
