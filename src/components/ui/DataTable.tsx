"use client";

import { useMemo, useState } from "react";
import { Card } from "./Card";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  /** Sort value; columns without it aren't sortable. */
  sort?: (row: T) => number | string;
  align?: "left" | "right";
}

type SortState = { key: string; dir: 1 | -1 };

/** Sortable table with a text filter over `searchText(row)`. */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  initialSort,
  searchText,
  searchPlaceholder = "Buscar…",
}: {
  rows: T[];
  columns: Column<T>[];
  initialSort: SortState;
  searchText: (row: T) => string;
  searchPlaceholder?: string;
}) {
  const [sort, setSort] = useState(initialSort);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    const get = columns.find((c) => c.key === sort.key)?.sort;
    if (!get) return filtered;
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [rows, columns, sort, query, searchText]);

  const toggleSort = (key: string) => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }));

  return (
    <Card className="p-0 sm:p-0">
      <div className="border-b border-line p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                  className={`px-4 py-3 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}
                >
                  {c.sort ? (
                    <button onClick={() => toggleSort(c.key)} className="hover:text-ink">
                      {c.label} {sort.key === c.key ? (sort.dir === 1 ? "↑" : "↓") : ""}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 ${c.align === "right" ? "text-right text-ink-2" : "text-ink"}`}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum resultado para “{query}”.</p>}
      </div>
    </Card>
  );
}
