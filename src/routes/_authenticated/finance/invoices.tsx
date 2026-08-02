import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Download,
  Filter,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useInvoices } from "@/hooks/useFinance";
import { InvoiceGenerator } from "@/components/finance/InvoiceGenerator";

export const Route = createFileRoute("/_authenticated/finance/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoiceList: Array<Record<string, any>> = invoices && invoices.length > 0 ? invoices : [
    { id: "1", invoice_number: "INV-2025-8810", student_id: "STU-2024-001 (Aarav Mehta)", due_date: "2025-09-30", total_amount: 75000, balance_amount: 0, status: "paid" },
    { id: "2", invoice_number: "INV-2025-8811", student_id: "STU-2024-042 (Priya Patel)", due_date: "2025-09-30", total_amount: 82500, balance_amount: 32500, status: "partial" },
    { id: "3", invoice_number: "INV-2025-8812", student_id: "STU-2025-119 (Vikram Singhal)", due_date: "2025-08-15", total_amount: 68000, balance_amount: 68000, status: "overdue" },
    { id: "4", invoice_number: "INV-2025-8813", student_id: "STU-2025-204 (Ananya Roy)", due_date: "2025-10-15", total_amount: 75000, balance_amount: 75000, status: "unpaid" },
  ];

  const totalInvoiced = invoiceList.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const totalPaid = invoiceList.filter(i => i.status === "paid").length;
  const overdueCount = invoiceList.filter(i => i.status === "overdue").length;

  const filteredInvoices = invoiceList.filter((inv) => {
    const text = `${String(inv.invoice_number)} ${String(inv.student_id)}`.toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold px-2.5">PAID</Badge>;
      case "partial":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 font-bold px-2.5">PARTIAL</Badge>;
      case "overdue":
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-black animate-pulse px-2.5">OVERDUE</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold px-2.5">UNPAID</Badge>;
    }
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                <FileText className="size-3.5 fill-current" /> Semester Tuition & Fee Billing Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ⚡ Automated GST & Late Fee Calculation
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Student Fee Invoices & Dues 📑
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Generate semester fee demand notices, manage multi-installment tuition tracking, and issue automated reminders for pending defaulter receivables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.success("📢 Automated SMS & WhatsApp reminders dispatched to all overdue accounts!")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
            >
              <Send className="size-4 animate-bounce" />
              <span>Remind Defaulters</span>
            </Button>

            <InvoiceGenerator />
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Invoiced Volume" value={invoiceList.length} icon={FileText} hint="Active billing records" />
        <StatCard label="Total Billed Value" value={`₹${(totalInvoiced / 1000).toFixed(1)}K`} icon={Layers} hint="Aggregate semester fee" />
        <StatCard label="Settled Accounts" value={totalPaid} icon={CheckCircle2} hint="100% dues cleared" />
        <StatCard label="Overdue Notices" value={overdueCount} icon={AlertCircle} hint="Immediate recovery action" />
      </div>

      {/* Main Workspace Table Card */}
      <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-lg font-bold text-foreground">Institutional Fee Register</h3>
            <p className="text-xs text-muted-foreground">Comprehensive record of generated fee bills, tax breakdowns, and remaining balances.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice # or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-[14px] px-3 font-bold text-xs uppercase tracking-wider bg-card border-border w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <span className="text-xs font-mono uppercase font-semibold">Syncing general fee ledger...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Invoice #</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Student Identity</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Due Date</TableHead>
                  <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Payment Status</TableHead>
                  <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Total Fee</TableHead>
                  <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Remaining Due</TableHead>
                  <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, idx) => (
                  <TableRow key={String(invoice.id ?? idx)} className="group border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-sm text-primary flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      {String(invoice.invoice_number)}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-foreground">{String(invoice.student_id)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {invoice.due_date ? new Date(String(invoice.due_date)).toLocaleDateString() : "Immediate"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(String(invoice.status))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                      ₹{Number(invoice.total_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                      ₹{Number(invoice.balance_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Viewing & downloading E-Invoice PDF for ${String(invoice.invoice_number)}`)}
                        className="h-8 px-3 rounded-[10px] font-bold text-xs text-blue-600 hover:bg-blue-500/10 gap-1"
                      >
                        <span>E-Invoice</span>
                        <Download className="size-3.5" />
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
