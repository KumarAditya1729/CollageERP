import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Sparkles, Inbox, UploadCloud, Plus, RefreshCw } from "lucide-react";
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
  showDefaultActions = false,
  onImport,
  onCreate,
  onAskAI,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  showDefaultActions?: boolean;
  onImport?: () => void;
  onCreate?: () => void;
  onAskAI?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-8 py-16 text-center rounded-[20px] border border-dashed border-border bg-card/60 shadow-2xs my-3 transition-all duration-180",
        className,
      )}
    >
      <div className="relative mb-3 flex items-center justify-center">
        <div className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md opacity-60" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-xs text-primary">
          <Icon className="size-7" aria-hidden />
        </div>
      </div>
      <h3 className="mt-2 text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
      
      {action ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>
      ) : showDefaultActions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {onImport ? (
            <Button variant="outline" size="sm" onClick={onImport} className="rounded-[14px]">
              <UploadCloud className="size-4 mr-1.5 text-muted-foreground" />
              Import CSV
            </Button>
          ) : null}
          {onCreate ? (
            <Button size="sm" onClick={onCreate} className="rounded-[14px]">
              <Plus className="size-4 mr-1.5" />
              Create Record
            </Button>
          ) : null}
          {onAskAI ? (
            <Button variant="secondary" size="sm" onClick={onAskAI} className="rounded-[14px] bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-300">
              <Sparkles className="size-4 mr-1.5 text-purple-500" />
              Ask AI
            </Button>
          ) : null}
        </div>
      ) : null}
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
        "flex flex-col items-center justify-center px-8 py-16 text-center rounded-[20px] border border-destructive/30 bg-destructive/5 my-3",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-destructive/30 bg-card shadow-xs mb-2">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <h3 className="mt-2 text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-6 rounded-[14px] border-destructive/40 hover:bg-destructive/10 text-destructive" onClick={onRetry}>
          <RefreshCw className="size-4 mr-1.5" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-5 shadow-xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <Skeleton className="h-5 w-36 rounded-lg bg-muted-foreground/15" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-[14px] bg-muted" />
          <Skeleton className="h-8 w-24 rounded-[14px] bg-muted" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4 flex-1 rounded-md bg-muted-foreground/15", colIndex === 0 ? "max-w-[160px] h-5" : "opacity-70")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-[20px] border border-border bg-card p-6 shadow-xs animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-md bg-muted-foreground/20" />
            <Skeleton className="size-8 rounded-xl bg-muted-foreground/15" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg bg-muted-foreground/25" />
          <Skeleton className="h-3 w-40 rounded-md bg-muted-foreground/15" />
        </div>
      ))}
    </div>
  );
}

export function InlineLoader({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-14 text-sm text-muted-foreground animate-pulse">
      <div className="flex items-center gap-2 w-full max-w-sm">
        <Skeleton className="h-2 w-12 rounded-full bg-primary/40" />
        <Skeleton className="h-2 flex-1 rounded-full bg-muted-foreground/20" />
        <Skeleton className="h-2 w-8 rounded-full bg-muted-foreground/20" />
      </div>
      <span className="font-medium tracking-tight text-xs uppercase font-mono">{label}</span>
    </div>
  );
}
