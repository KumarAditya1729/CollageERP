import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
  className,
  footer,
}: {
  label: string;
  value: number | string | null | undefined;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-border/80 bg-card/90",
        className,
      )}
    >
      {/* Subtle Stripe-inspired gradient header line on card */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary/80 via-chart-2/70 to-primary/40 opacity-75 transition-opacity group-hover:opacity-100" />
      <CardContent className="pt-6 pb-5 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-9 w-24 rounded-lg my-1" />
            ) : (
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground mt-1">
                {value ?? "—"}
              </p>
            )}
            {hint ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium pt-0.5">
                {hint}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-primary/10 text-primary dark:bg-primary/20 shadow-xs transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
              <Icon className="size-5" aria-hidden />
            </div>
          ) : null}
        </div>
        {footer ? <div className="mt-4 border-t border-border/60 pt-3 text-xs">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
