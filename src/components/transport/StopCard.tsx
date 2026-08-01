/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

export function StopCard({ stop, onClick }: { stop: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {stop.name}
          </CardTitle>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
            Seq: {stop.stop_sequence}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Pickup: {stop.pickup_time || "--:--"}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Drop: {stop.drop_time || "--:--"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
