import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-4 pb-4 mb-6 border-b border-border/60">
      {crumbs.length > 0 ? (
        <Breadcrumb className="text-xs font-medium text-muted-foreground/80">
          <BreadcrumbList className="flex items-center gap-1.5">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <BreadcrumbItem key={`${crumb.label}-${index}`} className="flex items-center">
                  {last || !crumb.to ? (
                    <BreadcrumbPage className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link
                          to={crumb.to}
                          className="px-2 py-0.5 rounded-md hover:bg-muted/40 hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator className="opacity-60 text-muted-foreground" />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
