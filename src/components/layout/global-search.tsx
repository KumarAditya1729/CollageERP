import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Pin, PinOff, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { PREF_KEYS, useLocalList } from "@/hooks/useLocalList";
import { allNavItems } from "@/lib/nav";

interface SearchRow {
  id: string;
  entity_type: string;
  title: string;
  subtitle: string | null;
  module: string | null;
  url: string | null;
}

const labels: Record<string, string> = {
  student: "Students",
  faculty: "Faculty",
  staff: "Staff",
  course: "Courses",
  program: "Programs",
  department: "Departments",
  document: "Documents",
  form: "Forms",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { tenant, can } = useAccess();
  const navigate = useNavigate();
  const recentSearches = useLocalList(PREF_KEYS.recentSearches, 8);
  const pinnedResults = useLocalList(PREF_KEYS.pinnedResults, 8);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", tenant?.id, term],
    enabled: Boolean(tenant?.id) && term.trim().length >= 2,
    queryFn: async () => {
      const needle = `%${term.trim()}%`;
      const { data, error } = await supabase
        .from("search_index")
        .select("id, entity_type, title, subtitle, module, url")
        .eq("tenant_id", tenant!.id)
        .or(`title.ilike.${needle},subtitle.ilike.${needle},keywords.ilike.${needle}`)
        .limit(25);
      if (error) throw error;
      return (data ?? []) as SearchRow[];
    },
  });

  const results = data ?? [];
  const grouped = results.reduce<Record<string, SearchRow[]>>((acc, row) => {
    const key = labels[row.entity_type] ?? row.entity_type;
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  const pages = allNavItems.filter(
    (item) =>
      (!item.permission || can(item.permission)) &&
      item.title.toLowerCase().includes(term.trim().toLowerCase()),
  );

  const go = (to: string) => {
    const trimmed = term.trim();
    if (trimmed.length >= 2) recentSearches.add(trimmed);
    setOpen(false);
    setTerm("");
    navigate({ to });
  };

  const pinned = pinnedResults.items
    .map((entry) => {
      const [title, url] = entry.split("::");
      return url ? { title, url } : null;
    })
    .filter((entry): entry is { title: string; url: string } => Boolean(entry));

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-full justify-between gap-2 rounded-lg border-border/80 bg-muted/30 px-3.5 text-muted-foreground hover:bg-muted/60 hover:border-border hover:text-foreground transition-all sm:w-72 shadow-2xs group"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="size-4 text-muted-foreground/80 group-hover:text-primary transition-colors" />
          <span className="truncate text-sm font-medium">Quick Search...</span>
        </div>
        <kbd className="hidden rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground/90 shadow-2xs sm:inline-block">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Search students, faculty, courses, documents…"
        />
        <CommandList>
          <CommandEmpty>
            {term.trim().length < 2
              ? "Type at least two characters to search."
              : isFetching
                ? "Searching…"
                : "No results found."}
          </CommandEmpty>

          {term.trim().length < 2 && pinned.length > 0 ? (
            <>
              <CommandGroup heading="Pinned">
                {pinned.map((entry) => (
                  <CommandItem
                    key={entry.url}
                    value={`pin-${entry.title}`}
                    onSelect={() => go(entry.url)}
                  >
                    <Pin className="size-4" />
                    <span className="truncate">{entry.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}

          {term.trim().length < 2 && recentSearches.items.length > 0 ? (
            <>
              <CommandGroup heading="Recent searches">
                {recentSearches.items.map((entry) => (
                  <CommandItem
                    key={entry}
                    value={`recent-${entry}`}
                    onSelect={() => setTerm(entry)}
                  >
                    <Clock className="size-4" />
                    <span className="truncate">{entry}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}

          {pages.length > 0 ? (
            <>
              <CommandGroup heading="Navigation">
                {pages.map((item) => (
                  <CommandItem
                    key={item.to}
                    value={`nav-${item.title}`}
                    onSelect={() => go(item.to)}
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}

          {Object.entries(grouped).map(([heading, rows]) => (
            <CommandGroup key={heading} heading={heading}>
              {rows.map((row) => (
                <CommandItem
                  key={row.id}
                  value={`${row.id}-${row.title}`}
                  onSelect={() => row.url && go(row.url)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{row.title}</p>
                    {row.subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
                    ) : null}
                  </div>
                  {row.url ? (
                    <button
                      type="button"
                      aria-label={
                        pinnedResults.has(`${row.title}::${row.url}`)
                          ? "Unpin result"
                          : "Pin result"
                      }
                      className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        pinnedResults.toggle(`${row.title}::${row.url}`);
                      }}
                    >
                      {pinnedResults.has(`${row.title}::${row.url}`) ? (
                        <PinOff className="size-3.5" />
                      ) : (
                        <Pin className="size-3.5" />
                      )}
                    </button>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
