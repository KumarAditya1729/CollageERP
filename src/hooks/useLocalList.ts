import { useCallback, useEffect, useState } from "react";

/**
 * Small typed wrapper around localStorage lists used for user preferences
 * (favourites, pinned results, recent searches). Reads happen after mount so
 * server rendering and hydration stay in sync.
 */
export function useLocalList(key: string, limit = 20) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setItems(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setItems([]);
    }
  }, [key]);

  const persist = useCallback(
    (next: string[]) => {
      window.localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
    },
    [key],
  );

  const add = useCallback(
    (value: string) => persist([value, ...items.filter((item) => item !== value)].slice(0, limit)),
    [items, limit, persist],
  );

  const remove = useCallback(
    (value: string) => persist(items.filter((item) => item !== value)),
    [items, persist],
  );

  const toggle = useCallback(
    (value: string) => (items.includes(value) ? remove(value) : add(value)),
    [items, add, remove],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, add, remove, toggle, clear, has: (value: string) => items.includes(value) };
}

export const PREF_KEYS = {
  pins: "campusos.pins",
  recents: "campusos.recents",
  recentSearches: "campusos.recent-searches",
  pinnedResults: "campusos.pinned-results",
  favouriteMedia: "campusos.favourite-media",
  academicYear: "campusos.academic-year",
  academicSession: "campusos.academic-session",
} as const;
