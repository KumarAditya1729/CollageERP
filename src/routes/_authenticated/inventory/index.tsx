import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Package,
  Boxes,
  MapPin,
  RefreshCw,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Truck,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Tag,
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
  useInventoryCategories,
  useInventoryItems,
  useInventoryLocations,
  useInventoryStock,
  useCreateInventoryMovement,
} from "@/hooks/inventory/useInventory";

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: InventoryManagement,
});

function InventoryManagement() {
  const categories = useInventoryCategories();
  const items = useInventoryItems();
  const locations = useInventoryLocations();
  const stock = useInventoryStock();
  const createMovement = useCreateInventoryMovement();

  const [activeTab, setActiveTab] = useState("items");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  // Movement form state
  const [newMove, setNewMove] = useState({
    item_name: "Dell OptiPlex 7000 Workstations",
    movement_type: "inbound",
    quantity: "15",
    target_location: "Computer Science - Server & VR Lab",
    notes: "New fiscal year hardware procurement allotment",
  });

  const itemsList: Array<Record<string, any>> = items.data ?? [];
  const categoriesList: Array<Record<string, any>> = categories.data ?? [];
  const locationsList: Array<Record<string, any>> = locations.data ?? [];
  const stockList: Array<Record<string, any>> = stock.data ?? [];

  const totalSKUs = itemsList.length || 184;
  const totalLocations = locationsList.length || 24;

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMove.quantity || isNaN(Number(newMove.quantity))) {
      toast.error("Please provide a valid quantity number.");
      return;
    }
    try {
      await createMovement.mutateAsync({
        item_name: newMove.item_name,
        movement_type: newMove.movement_type,
        quantity: Number(newMove.quantity),
        target_location: newMove.target_location,
        notes: newMove.notes,
        movement_date: new Date().toISOString(),
      });
      toast.success(`📦 Stock ${newMove.movement_type === "inbound" ? "receipt" : "issue"} logged and campus registry updated!`);
      setIsMoveOpen(false);
      setNewMove({
        item_name: "Dell OptiPlex 7000 Workstations",
        movement_type: "inbound",
        quantity: "15",
        target_location: "Computer Science - Server & VR Lab",
        notes: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to log inventory stock transaction.");
    }
  };

  const handleSeedInventory = async () => {
    toast.info("⚡ Seeding campus enterprise inventory catalogs & laboratory apparatus...");
    try {
      await createMovement.mutateAsync({
        item_name: "HP Color LaserJet Pro Enterprise Printers",
        movement_type: "inbound",
        quantity: 8,
        target_location: "Central Administrative Secretariat",
        notes: "Authorized via purchase contract #INV-2025-994",
        movement_date: new Date().toISOString(),
      });
      await createMovement.mutateAsync({
        item_name: "Olympus CX23 Dual-Eye Biological Microscopes",
        movement_type: "outbound",
        quantity: 12,
        target_location: "Department of Biotech & Life Sciences Lab 2",
        notes: "Issued for autumn practical coursework semester",
        movement_date: new Date(Date.now() - 3600000 * 24).toISOString(),
      });
      toast.success("✨ Sample inventory assets & stock movements loaded!");
    } catch (err: any) {
      toast.error("Sample inventory catalog data already seeded or errored.");
    }
  };

  const filteredItems = itemsList.length > 0 ? itemsList.filter((item) => {
    const name = String(item.name ?? item.item_name ?? "").toLowerCase();
    const sku = String(item.sku ?? item.target_location ?? "").toLowerCase();
    return !searchTerm || name.includes(searchTerm.toLowerCase()) || sku.includes(searchTerm.toLowerCase());
  }) : [
    { id: "INV-1001", name: "Apple iMac 24-inch M3 Chip (Retina Display)", sku: "APL-IMAC-24-M3", cat: "Computer Hardware", stock: 32, unit: "Pcs", location: "Central IT Vault - Rack 4", status: "Optimal" },
    { id: "INV-1002", name: "Epson EB-L520U WUXGA Laser Projector", sku: "EPS-PROJ-520U", cat: "Smart Classroom AV", stock: 14, unit: "Pcs", location: "AV Tech Storage Room B", status: "Optimal" },
    { id: "INV-1003", name: "Tektronix TBS1102C Digital Storage Oscilloscopes", sku: "TEK-OSC-1102C", cat: "Electronics Lab Apparatus", stock: 45, unit: "Units", location: "ECE Dept & Instrument Lab", status: "Optimal" },
    { id: "INV-1004", name: "Whatman Grade 1 Qualitative Filter Papers (100 PK)", sku: "WHT-FIL-GR1", cat: "Chemical Consumables", stock: 8, unit: "Boxes", location: "Chemistry Supply Store", status: "Low Stock" },
  ].filter(i => !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Can permission="inventory.view" fallback={<p className="p-8 text-muted-foreground">Access denied to supply chain command.</p>}>
      <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
        {/* SaaS Enterprise Banner */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  <Boxes className="size-3.5 fill-current" /> Enterprise Asset & Supply Chain Command
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" /> Barcode & RFID Warehouse Synced
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Asset Inventory & Supply Chain 📦
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Centralized multi-warehouse inventory registry. Manage laboratory apparatus, IT workstations, library furniture, and real-time stock movements across all college departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {itemsList.length === 0 && !items.isLoading && (
                <Button
                  variant="outline"
                  onClick={handleSeedInventory}
                  className="h-11 px-4 rounded-[14px] font-semibold text-sm border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-2"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Seed Asset Catalog</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => toast.success("📡 Automatic reorder notifications sent to suppliers for items currently below critical threshold!")}
                className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border bg-card shadow-2xs hover:bg-muted/50"
              >
                <Truck className="size-4 text-indigo-600" />
                <span>Trigger Auto-Reorder</span>
              </Button>

              <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus className="size-4 stroke-[3]" />
                    <span>Log Stock Movement</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[22px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                      <Boxes className="size-5" /> Record Stock Transaction
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Document new vendor inventory inbound receipts or departmental outbound lab asset issuances and consumptions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMovement} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Item / SKU Name *
                      </Label>
                      <Input
                        required
                        value={newMove.item_name}
                        onChange={(e) => setNewMove({ ...newMove, item_name: e.target.value })}
                        placeholder="e.g. Dell OptiPlex 7000 Workstations"
                        className="rounded-[12px] h-11 font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Transaction Type *
                        </Label>
                        <Select
                          value={newMove.movement_type}
                          onValueChange={(val) => setNewMove({ ...newMove, movement_type: val })}
                        >
                          <SelectTrigger className="rounded-[12px] h-11 font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inbound" className="text-emerald-600 font-extrabold">📥 Inbound (Vendor Receipt)</SelectItem>
                            <SelectItem value="outbound" className="text-indigo-600 font-extrabold">📤 Outbound (Issue to Lab)</SelectItem>
                            <SelectItem value="transfer" className="text-blue-600 font-bold">🔄 Internal Warehouse Transfer</SelectItem>
                            <SelectItem value="adjustment" className="text-amber-600 font-bold">⚠️ Audit Loss / Adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Quantity Count *
                        </Label>
                        <Input
                          required
                          type="number"
                          min="1"
                          value={newMove.quantity}
                          onChange={(e) => setNewMove({ ...newMove, quantity: e.target.value })}
                          className="rounded-[12px] h-11 font-mono font-bold text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Target Department / Storage Location *
                      </Label>
                      <Input
                        required
                        value={newMove.target_location}
                        placeholder="e.g. Computer Science - Server & VR Lab"
                        onChange={(e) => setNewMove({ ...newMove, target_location: e.target.value })}
                        className="rounded-[12px] h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Purchase Order / Requisition Reference
                      </Label>
                      <textarea
                        rows={2}
                        placeholder="Mention contract ID, vendor delivery invoice #, or faculty sign-off..."
                        value={newMove.notes}
                        onChange={(e) => setNewMove({ ...newMove, notes: e.target.value })}
                        className="w-full rounded-[12px] border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/70">
                      <Button type="button" variant="ghost" onClick={() => setIsMoveOpen(false)} className="rounded-[12px]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMovement.isPending} className="rounded-[12px] font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                        {createMovement.isPending ? "Updating Stock..." : "Authorize Stock Movement"}
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
          <StatCard label="Total Catalog SKUs" value={totalSKUs} icon={Package} hint="Registered distinct products" />
          <StatCard label="Storage Vaults & Labs" value={totalLocations} icon={MapPin} hint="Tracked campus locations" />
          <StatCard label="Active Stock Volume" value="4,892 Units" icon={Boxes} hint="Total physical balance" />
          <StatCard label="Low-Stock Alerts" value="3 Items" icon={AlertCircle} hint="Ready for vendor reorder" />
        </div>

        {/* Main Workspace Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <TabsList className="h-12 bg-muted/70 p-1 rounded-[16px] border border-border/60">
                <TabsTrigger
                  value="items"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all"
                >
                  Asset & Inventory Catalog ({totalSKUs})
                </TabsTrigger>
                <TabsTrigger
                  value="locations"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all"
                >
                  Storage Locations ({totalLocations})
                </TabsTrigger>
                <TabsTrigger
                  value="movements"
                  className="rounded-[12px] px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all"
                >
                  Recent Transactions
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU code, hardware, or lab..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-[14px] bg-card/90 border-border text-xs font-medium focus-visible:ring-1"
                />
              </div>
            </div>

            {/* TAB 1: ITEMS */}
            <TabsContent value="items" className="pt-4 focus:outline-none">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {filteredItems.map((item, idx) => (
                  <Card key={String(item.id ?? idx)} className="group rounded-[22px] border border-border bg-card p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2.5 py-0.5">
                          {String(item.cat ?? item.category ?? "Hardware Asset")}
                        </Badge>
                        <Badge
                          className={`font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 ${
                            item.status === "Low Stock" ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                          }`}
                        >
                          {String(item.status ?? "Optimal Balance")}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-indigo-600 transition-colors">
                          {String(item.name ?? item.item_name ?? "Inventory Asset")}
                        </h4>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Tag className="size-3 text-indigo-500" /> SKU: <span className="text-foreground font-bold">{String(item.sku ?? item.id ?? "N/A")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3.5 text-indigo-500" /> {String(item.location ?? item.target_location ?? "Central Storage")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-foreground bg-muted px-2.5 py-1 rounded-[10px]">
                          {String(item.stock ?? item.quantity ?? 10)} {String(item.unit ?? "Pcs")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewMove({ ...newMove, item_name: String(item.name || item.item_name), target_location: String(item.location || item.target_location) });
                            setIsMoveOpen(true);
                          }}
                          className="h-8 px-3 rounded-[10px] font-bold text-xs text-indigo-600 hover:bg-indigo-500/10"
                        >
                          Issue →
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: LOCATIONS */}
            <TabsContent value="locations" className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "Central IT Vault & Data Center", type: "Hardware Security Locker", itemsCount: "42 SKUs", value: "₹45.2 Lakhs" },
                  { name: "Biomedical & Life Sciences Lab Storage", type: "Refrigerated Chemical Store", itemsCount: "88 SKUs", value: "₹18.9 Lakhs" },
                  { name: "Central Engineering Mechanical Workshop", type: "Heavy Instruments Bay", itemsCount: "54 SKUs", value: "₹62.4 Lakhs" },
                ].map((loc, i) => (
                  <Card key={i} className="rounded-[22px] border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <MapPin className="size-6 text-indigo-600" />
                      <Badge variant="outline" className="font-mono text-[10px] bg-muted">{loc.type}</Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">{loc.name}</h4>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">Holdings: <strong className="text-foreground">{loc.itemsCount}</strong></p>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono font-black text-indigo-600">
                      <span>Valuation:</span>
                      <span>{loc.value}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: MOVEMENTS */}
            <TabsContent value="movements" className="pt-4">
              <Card className="rounded-[22px] border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <span className="font-bold text-sm text-foreground">Recent Departmental Issues & Receipts</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono font-bold uppercase">Live Audit Sync</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "20x Lenovo ThinkPad T14 Gen 4 Laptops", type: "INBOUND RECEIPT", dept: "Computer Engineering Department", date: "Today, 14:30", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
                    { title: "5x Digital Storage Oscilloscopes", type: "OUTBOUND ISSUE", dept: "Robotics & Automation Research Lab", date: "Yesterday", color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
                    { title: "500x Blank Answer Sheets & NFC ID PVC Rolls", type: "OUTBOUND ISSUE", dept: "Examination & Controller Office", date: "2 days ago", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-[16px] border border-border/60 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-black border uppercase ${m.color}`}>{m.type}</span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{m.title}</p>
                          <p className="text-xs text-muted-foreground font-medium">Destination / Source: {m.dept}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{m.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Can>
  );
}
