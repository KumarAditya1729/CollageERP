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
    <div className="space-y-4 pb-5 mb-6 border-b border-border/60 w-full min-w-0">
      {crumbs.length > 0 ? (
        <Breadcrumb className="text-xs font-medium text-muted-foreground/80 overflow-x-auto no-scrollbar py-0.5">
          <BreadcrumbList className="flex items-center gap-1.5 flex-nowrap min-w-0">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <BreadcrumbItem key={`${crumb.label}-${index}`} className="flex items-center shrink-0">
                  {last || !crumb.to ? (
                    <BreadcrumbPage className="font-bold text-foreground bg-muted/70 px-2.5 py-0.5 rounded-lg truncate max-w-[220px] sm:max-w-none">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link
                          to={crumb.to}
                          className="px-2 py-0.5 rounded-lg hover:bg-muted/50 hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none font-semibold"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator className="opacity-50 text-muted-foreground ml-0.5" />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:items-center sm:justify-between w-full min-w-0">
        <div className="space-y-1.5 min-w-0 flex-1 pr-2">
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-foreground break-words leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl xl:max-w-5xl 2xl:max-w-none text-xs sm:text-sm text-muted-foreground/90 leading-relaxed break-words">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-center lg:self-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
