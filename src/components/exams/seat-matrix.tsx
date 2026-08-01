import { Accessibility } from "lucide-react";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SeatMatrixSeat {
  id: string;
  seatNumber: string;
  rowLabel: string | null;
  benchNumber: number | null;
  studentName: string;
  rollNumber: string | null;
  specialNeeds: boolean;
  verificationCode: string | null;
}

export interface SeatMatrixHall {
  id: string;
  roomName: string;
  buildingName: string | null;
  floor: number | null;
  blockLabel: string | null;
  capacity: number;
  specialNeeds: boolean;
  seats: SeatMatrixSeat[];
}

/** Hall-wise seating chart — one card per exam room with a bench-grouped seat grid. */
export function SeatMatrix({
  halls,
  onSelect,
  selectedSeatId,
}: {
  halls: SeatMatrixHall[];
  onSelect?: (seat: SeatMatrixSeat, hall: SeatMatrixHall) => void;
  selectedSeatId?: string | null;
}) {
  if (!halls.length) {
    return (
      <EmptyState
        title="No halls allocated"
        description="Add exam rooms to this paper, then run automatic seating to build the seat matrix."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {halls.map((hall) => {
        const rows = new Map<string, SeatMatrixSeat[]>();
        for (const seat of hall.seats) {
          const key = seat.rowLabel ?? "—";
          rows.set(key, [...(rows.get(key) ?? []), seat]);
        }
        return (
          <Card key={hall.id} className="shadow-none">
            <CardHeader className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{hall.roomName}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {hall.specialNeeds ? (
                    <Badge variant="secondary" className="gap-1">
                      <Accessibility className="size-3" /> Special needs
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {hall.seats.length} / {hall.capacity} seats
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {[
                  hall.buildingName,
                  hall.blockLabel ? `Block ${hall.blockLabel}` : null,
                  hall.floor !== null ? `Floor ${hall.floor}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Location not set"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hall.seats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No candidates seated in this hall yet.
                </p>
              ) : (
                [...rows.entries()].map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Row {rowLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => onSelect?.(seat, hall)}
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                            "hover:border-primary/60 hover:bg-accent",
                            seat.specialNeeds && "border-dashed",
                            selectedSeatId === seat.id && "border-primary bg-accent",
                          )}
                          title={`${seat.studentName}${seat.benchNumber ? ` · bench ${seat.benchNumber}` : ""}`}
                        >
                          <span className="block font-medium tabular-nums">{seat.seatNumber}</span>
                          <span className="block max-w-28 truncate text-muted-foreground">
                            {seat.rollNumber ?? seat.studentName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
