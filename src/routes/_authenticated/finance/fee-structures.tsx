import { createFileRoute } from "@tanstack/react-router";
import {
  Layers,
  Plus,
  BookOpen,
  CheckCircle2,
  Settings2,
  DollarSign,
  Banknote,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFeeStructures, useFeeHeads, useCreateFeeStructure, useCreateFeeHead } from "@/hooks/useFinance";
export const Route = createFileRoute("/_authenticated/finance/fee-structures")({
  component: FeeStructuresPage,
});

function FeeStructuresPage() {
  const { data: structures, isLoading: isLoadingStructures } = useFeeStructures();
  const { data: heads, isLoading: isLoadingHeads } = useFeeHeads();

  const [openStructureDialog, setOpenStructureDialog] = useState(false);
  const [openHeadDialog, setOpenHeadDialog] = useState(false);

  const createStructure = useCreateFeeStructure();
  const createHead = useCreateFeeHead();

  const structureList = structures ?? [];
  const headList = heads ?? [];

  const avgTuition = structureList.length > 0 
    ? Math.round(structureList.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) / structureList.length)
    : 0;
  const refundableHeads = headList.filter(h => h.is_refundable).length;

  const handleCreateStructure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const program_id = formData.get("program_id") as string;
    const total_amount = Number(formData.get("total_amount"));
    
    await createStructure.mutateAsync({
      name,
      program_id,
      total_amount,
      academic_year_id: "ay-2024", // Defaulting for demo purposes
      fee_category_id: null,
    });
    
    setOpenStructureDialog(false);
  };

  const handleCreateHead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const default_amount = Number(formData.get("default_amount"));
    const frequency = formData.get("frequency") as "one_time" | "recurring" | "optional";
    
    await createHead.mutateAsync({
      name,
      code,
      default_amount,
      frequency,
      is_refundable: false,
      tax_percent: 0,
      description: null,
    });
    
    setOpenHeadDialog(false);
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Layers className="size-3.5 fill-current" /> Tuition Architecture & Head Configuration
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                💼 Multi-Program Semester Mapping
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Academic Fee Structures & Heads 📐
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Architect comprehensive semester fee tables, define recurring vs. refundable tuition heads, and bind automated scholarship deduction matrices to academic degrees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Create Fee Head Dialog */}
            <Dialog open={openHeadDialog} onOpenChange={setOpenHeadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card text-indigo-600 hover:bg-indigo-500/10">
                  <Plus className="size-4" />
                  <span>New Fee Head</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[24px] p-6 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                    <Settings2 className="size-5 text-indigo-600" /> Register Fee Head
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Define a reusable financial tuition component for student invoicing.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateHead} className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Head Title</Label>
                    <Input name="name" placeholder="e.g. Advanced Robotics Lab Fee" required className="rounded-[12px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Billing Code</Label>
                      <Input name="code" placeholder="ROBO-LAB" required className="rounded-[12px] font-mono uppercase" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Default Amount (₹)</Label>
                      <Input name="default_amount" type="number" placeholder="15000" required className="rounded-[12px] font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Billing Frequency</Label>
                    <Select name="frequency" defaultValue="recurring">
                      <SelectTrigger className="rounded-[12px] font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recurring">Recurring (Each Semester)</SelectItem>
                        <SelectItem value="one_time">One-Time (At Admission)</SelectItem>
                        <SelectItem value="optional">Optional / Elective Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4 border-t border-border">
                    <Button type="submit" className="w-full rounded-[14px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white">
                      Save Fee Head
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create Fee Structure Dialog */}
            <Dialog open={openStructureDialog} onOpenChange={setOpenStructureDialog}>
              <DialogTrigger asChild>
                <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Plus className="size-4" />
                  <span>New Fee Structure</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[24px] p-6 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                    <Layers className="size-5 text-indigo-600" /> Assemble Fee Structure
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Bind fee heads into a master tuition package for an academic degree program.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateStructure} className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Structure Title</Label>
                    <Input name="name" placeholder="e.g. B.Tech Artificial Intelligence (AY 2025-26)" required className="rounded-[12px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Target Academic Program</Label>
                      <Input name="program_id" placeholder="B.Tech AI" required className="rounded-[12px] font-semibold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Total Aggregate Tuition (₹)</Label>
                      <Input name="total_amount" type="number" placeholder="145000" required className="rounded-[12px] font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Installment Splitting Policy</Label>
                    <Select defaultValue="equal_two">
                      <SelectTrigger className="rounded-[12px] font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal_two">Two Semester Installments (50% / 50%)</SelectItem>
                        <SelectItem value="upfront_full">Full Upfront Payment (100% at Admission)</SelectItem>
                        <SelectItem value="quarterly_four">Quarterly Installments (25% each quarter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4 border-t border-border">
                    <Button type="submit" className="w-full rounded-[14px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white">
                      Publish Structure to Billing Engine
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
        <StatCard label="Active Tuition Structures" value={structureList.length} icon={Layers} hint="Assigned to study degrees" />
        <StatCard label="Configured Fee Heads" value={headList.length} icon={Settings2} hint="Modular billing components" />
        <StatCard label="Average Degree Tuition" value={`₹${(avgTuition / 1000).toFixed(1)}K`} icon={Banknote} hint="Per academic year" />
        <StatCard label="Refundable Deposits" value={refundableHeads} icon={CheckCircle2} hint="Caution & library bonds" />
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="structures" className="space-y-6">
        <TabsList className="h-12 p-1.5 rounded-[16px] bg-muted/70 w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
          <TabsTrigger value="structures" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Layers className="size-4 text-indigo-600" />
            <span>Academic Fee Structures</span>
          </TabsTrigger>
          <TabsTrigger value="heads" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Settings2 className="size-4 text-purple-600" />
            <span>Individual Fee Heads</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structures">
          <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
              <div>
                <h3 className="text-lg font-bold text-foreground">Program Tuition Matrix</h3>
                <p className="text-xs text-muted-foreground">Master pricing schedules bound to undergraduate, postgraduate, and diploma curriculums.</p>
              </div>
            </div>

            {isLoadingStructures ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60 hover:bg-transparent">
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Structure Title</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Academic Program</TableHead>
                    <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Annual Tuition Fee</TableHead>
                    <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structureList.map((st, idx) => (
                    <TableRow key={String(st.id ?? idx)} className="group border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <BookOpen className="size-4 text-indigo-600" />
                        {String(st.name)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2.5">
                          {String(st.program_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-black text-sm text-foreground">
                        ₹{Number(st.total_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success(`Inspecting breakdown & fee head split for ${String(st.name)}`)}
                          className="h-8 px-3 rounded-[10px] font-bold text-xs text-indigo-600 hover:bg-indigo-500/10"
                        >
                          Configure Heads
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="heads">
          <Card className="rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-border/70">
              <div>
                <h3 className="text-lg font-bold text-foreground">General Ledger Fee Heads</h3>
                <p className="text-xs text-muted-foreground">Atomic fee categories (Tuition, Lab, Library, Hostel) utilized during bill calculation.</p>
              </div>
            </div>

            {isLoadingHeads ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60 hover:bg-transparent">
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Fee Head Title</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Account Code</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Billing Frequency</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-muted-foreground">Refundable Policy</TableHead>
                    <TableHead className="text-right font-extrabold text-xs uppercase text-muted-foreground">Default Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headList.map((hd, idx) => (
                    <TableRow key={String(hd.id ?? idx)} className="group border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <Settings2 className="size-4 text-purple-600" />
                        {String(hd.name)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs text-muted-foreground">
                        {String(hd.code)}
                      </TableCell>
                      <TableCell className="capitalize font-semibold text-xs">
                        <Badge variant="outline" className="bg-muted px-2 py-0.5">
                          {String(hd.frequency || "-").replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hd.is_refundable ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="size-3.5" /> Refundable
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium">Non-Refundable</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-black text-sm text-foreground">
                        ₹{Number(hd.default_amount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
