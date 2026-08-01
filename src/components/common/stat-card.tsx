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
    <Card className={cn("shadow-none", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {value ?? "—"}
              </p>
            )}
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {Icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
          ) : null}
        </div>
        {footer ? <div className="mt-4 border-t pt-3">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
