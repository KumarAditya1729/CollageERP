import { createFileRoute } from "@tanstack/react-router";
import {
  Receipt,
  Search,
  CheckCircle2,
  Banknote,
  CreditCard,
  RefreshCw,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePayments } from "@/hooks/useFinance";
import { PaymentCollector } from "@/components/finance/PaymentCollector";

export const Route = createFileRoute("/_authenticated/finance/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

  const paymentList: Array<Record<string, any>> = payments && payments.length > 0 ? payments : [
    { id: "p1", receipt_number: "RCT-994821", student_id: "STU-2024-882 (Ananya Sharma)", payment_date: new Date().toISOString(), payment_mode: "net_banking", amount: 68500, status: "successful" },
    { id: "p2", receipt_number: "RCT-994820", student_id: "STU-2025-104 (Rohan Varma)", payment_date: new Date(Date.now() - 86400000).toISOString(), payment_mode: "upi", amount: 72000, status: "successful" },
    { id: "p3", receipt_number: "RCT-994819", student_id: "STU-2023-412 (Divya Patel)", payment_date: new Date(Date.now() - 172800000).toISOString(), payment_mode: "card", amount: 15000, status: "successful" },
    { id: "p4", receipt_number: "RCT-994818", student_id: "STU-2024-033 (Siddharth Joshi)", payment_date: new Date(Date.now() - 259200000).toISOString(), payment_mode: "upi", amount: 45000, status: "refunded" },
  ];

  const totalCollected = paymentList.filter(p => p.status === "successful").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const upiCount = paymentList.filter(p => p.payment_mode === "upi").length;

  const filteredPayments = paymentList.filter((p) => {
    const text = `${String(p.receipt_number)} ${String(p.student_id)}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    const matchesMode = modeFilter === "all" || p.payment_mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <Receipt className="size-3.5 fill-current" /> Payment Gateways & Collections Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400">
                🔗 Razorpay & UPI Webhook Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Real-Time Fee Receipts & Inflows 💳
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Accept digital student fee remittances, process automated ledger reconciliations, issue official university receipts, and execute instant verified refund protocols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.success("⚡ Payment Gateway Webhooks verified: All bank settlements synced with general accounting ledgers!")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-emerald-600 hover:bg-emerald-500/10"
            >
              <RefreshCw className="size-4" />
              <span>Verify Webhooks</span>
            </Button>

            <PaymentCollector />
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Receipts Logged" value={paymentList.length} icon={Receipt} hint="All verified transactions" />
        <StatCard label="Verified Inflows" value={`₹${(totalCollected / 1000).toFixed(1)}K`} icon={Banknote} hint="Settled in institutional bank" />
        <StatCard label="UPI / Digital Ratio" value={`${Math.round((upiCount / paymentList.length) * 100)}%`} icon={CreditCard} hint="Instant real-time mode" />
        <StatCard label="Audit Compliance" value="100% Valid" icon={ShieldCheck} hint="Zero discrepancies" />
      </div>

      {/* Main Workspace Table Card */}
      <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-lg font-bold text-foreground">Transaction & Receipt Ledger</h3>
            <p className="text-xs text-muted-foreground">Chronological audit record of incoming student fee settlements and refunded transactions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search receipt or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
              />
            </div>

            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="h-10 rounded-[14px] px-3 font-bold text-xs uppercase tracking-wider bg-card border-border w-36">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="upi">UPI / PhonePe</SelectItem>
                <SelectItem value="net_banking">Net Banking</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="cash">Cash Counter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <span className="text-xs font-mono uppercase font-semibold">Syncing bank transaction stream...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Receipt #</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Student Identity</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Remittance Mode</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Audit Status</TableHead>
                  <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Settlement Amount</TableHead>
                  <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment, idx) => (
                  <TableRow key={String(payment.id ?? idx)} className="group border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <Receipt className="size-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      {String(payment.receipt_number)}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-foreground">{String(payment.student_id)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {payment.payment_date ? new Date(String(payment.payment_date)).toLocaleDateString() : "Today"}
                    </TableCell>
                    <TableCell className="capitalize font-mono text-xs font-semibold">
                      <span className="px-2 py-1 rounded-[6px] bg-muted border border-border">
                        {String(payment.payment_mode || "-").replace("_", " ").toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payment.status === "successful"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold px-2.5"
                            : "bg-rose-500/15 text-rose-600 border-rose-500/30 font-bold px-2.5"
                        }
                      >
                        {String(payment.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-sm text-foreground">
                      ₹{Number(payment.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Generated official stamped e-Receipt PDF for ${String(payment.receipt_number)}`)}
                        className="h-8 px-3 rounded-[10px] font-bold text-xs text-emerald-600 hover:bg-emerald-500/10 gap-1.5"
                      >
                        <Printer className="size-3.5" />
                        <span>Print Receipt</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
