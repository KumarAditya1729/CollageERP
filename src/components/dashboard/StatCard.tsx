import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendObj {
  value: number;
  label?: string;
  isPositive?: boolean;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  /** Accepts a plain number (positive = green, negative = red) or a TrendObj */
  trend?: number | TrendObj;
}

export function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  let trendValue: number | undefined;
  let trendLabel: string | undefined;
  let isPositive: boolean | undefined;

  if (typeof trend === "number") {
    trendValue = trend;
    isPositive = trend >= 0;
  } else if (trend && typeof trend === "object") {
    trendValue = trend.value;
    trendLabel = trend.label;
    isPositive = trend.isPositive ?? trend.value >= 0;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trendValue !== undefined && (
          <p className={`text-xs mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(trendValue)}%
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
