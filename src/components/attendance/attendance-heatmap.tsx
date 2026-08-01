import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface HeatmapCell {
  row: string;
  column: string;
  percentage: number;
  held: number;
}

/** Attendance percentage heatmap — rows are groups, columns are days or periods. */
export function AttendanceHeatmap({
  title,
  description,
  rows,
  columns,
  cells,
}: {
  title: string;
  description: string;
  rows: string[];
  columns: string[];
  cells: HeatmapCell[];
}) {
  const lookup = new Map(cells.map((cell) => [`${cell.row}|${cell.column}`, cell]));

  const tone = (percentage: number | undefined) => {
    if (percentage === undefined) return "bg-muted/40 text-muted-foreground";
    if (percentage >= 90) return "bg-primary text-primary-foreground";
    if (percentage >= 75) return "bg-primary/70 text-primary-foreground";
    if (percentage >= 60) return "bg-primary/40 text-foreground";
    if (percentage > 0) return "bg-destructive/40 text-foreground";
    return "bg-destructive/70 text-destructive-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 || columns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough attendance data yet.</p>
        ) : (
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground">&nbsp;</th>
                {columns.map((column) => (
                  <th key={column} className="px-1 text-left font-medium text-muted-foreground">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <th className="whitespace-nowrap pr-2 text-left font-medium">{row}</th>
                  {columns.map((column) => {
                    const cell = lookup.get(`${row}|${column}`);
                    return (
                      <td key={column}>
                        <div
                          title={
                            cell
                              ? `${row} · ${column}: ${cell.percentage}% of ${cell.held} sessions`
                              : `${row} · ${column}: no sessions`
                          }
                          className={cn(
                            "flex h-8 min-w-12 items-center justify-center rounded-md tabular-nums",
                            tone(cell?.percentage),
                          )}
                        >
                          {cell ? `${cell.percentage}%` : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
