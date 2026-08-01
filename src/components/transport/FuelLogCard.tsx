/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Calendar, DollarSign } from "lucide-react";

export function FuelLogCard({ log, onClick }: { log: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500" />
            {log.trn_vehicles?.registration_number || "Unknown Vehicle"}
          </CardTitle>
          <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {log.quantity_liters} L
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />{" "}
            {log.fill_date ? new Date(log.fill_date).toLocaleDateString() : "N/A"}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> {log.cost || 0}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
