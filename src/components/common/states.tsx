import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center rounded-xl border border-dashed border-border/80 bg-muted/15 my-2",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-linear-to-br from-primary/15 via-muted/50 to-transparent shadow-xs mb-1">
        <Icon className="size-6 text-primary" aria-hidden />
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center rounded-xl border border-destructive/30 bg-destructive/5 my-2",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/15 shadow-xs mb-1">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-6 border-destructive/40 hover:bg-destructive/10" onClick={onRetry}>
          <RefreshCw className="size-4 mr-1" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4 p-5 animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4 flex-1 rounded-md", colIndex === 0 ? "max-w-[180px] h-5" : "opacity-80")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-border/80">
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded opacity-70" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-6 py-10 text-sm font-medium text-muted-foreground">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
