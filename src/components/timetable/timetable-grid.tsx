import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { weekdayLabels } from "@/lib/attendance";

export interface GridEntry {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  title: string;
  subtitle: string;
  tone?: "default" | "warning";
}

/** Weekly timetable grid — one column per working day, entries sorted by start time. */
export function TimetableGrid({
  entries,
  workingDays,
  onSelect,
}: {
  entries: GridEntry[];
  workingDays: number[];
  onSelect?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly timetable</CardTitle>
        <CardDescription>
          {entries.length} scheduled classes across {workingDays.length} working days.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div
          className="grid min-w-[52rem] gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, workingDays.length)}, minmax(0, 1fr))`,
          }}
        >
          {workingDays.map((day) => {
            const dayEntries = entries
              .filter((entry) => entry.weekday === day)
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
            return (
              <div key={day} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {weekdayLabels[day] ?? `Day ${day}`}
                </p>
                {dayEntries.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    No classes
                  </p>
                ) : (
                  dayEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onSelect?.(entry.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                        entry.tone === "warning" && "border-destructive/50 bg-destructive/5",
                      )}
                    >
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {entry.starts_at.slice(0, 5)}–{entry.ends_at.slice(0, 5)}
                      </p>
                      <p className="truncate text-sm font-medium">{entry.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
                      {entry.tone === "warning" ? (
                        <Badge variant="destructive" className="mt-2">
                          Conflict
                        </Badge>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
