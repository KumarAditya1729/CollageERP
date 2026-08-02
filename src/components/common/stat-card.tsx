import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
  to,
}: {
  label: string;
  value: number | string | null | undefined;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
  footer?: ReactNode;
  to?: any;
}) {
  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 border-border/80 bg-card/95 h-full flex flex-col justify-between",
        to ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-primary/60 hover:bg-card" : "hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      {/* Subtle Stripe-inspired gradient header line on card */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-linear-to-r transition-all duration-300",
        to ? "from-primary via-chart-2 to-primary opacity-85 group-hover:opacity-100 group-hover:h-1.5" : "from-primary/80 via-chart-2/70 to-primary/40 opacity-75 group-hover:opacity-100"
      )} />
      
      <CardContent className="pt-6 pb-5 px-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 break-words leading-tight">
                  {label}
                </p>
                {to && (
                  <ArrowUpRight className="size-4 text-primary opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                )}
              </div>
              {loading ? (
                <Skeleton className="h-9 w-24 rounded-lg my-1.5" />
              ) : (
                <p className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground mt-1">
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
              <div className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 shadow-2xs transition-transform duration-200 group-hover:scale-110",
                to ? "bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground" : "bg-primary/10 text-primary dark:bg-primary/20"
              )}>
                <Icon className="size-5" aria-hidden />
              </div>
            ) : null}
          </div>
        </div>

        {to ? (
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
            <span className="truncate">Manage & inspect module</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1 shrink-0 ml-1 text-primary" />
          </div>
        ) : footer ? (
          <div className="mt-4 border-t border-border/60 pt-3 text-xs">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-[20px]">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
