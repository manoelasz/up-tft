"use client";

import { useMemo, useState } from "react";
import { Card } from "./ui";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string;
  align?: "left" | "right";
}

export function StatsTable<T extends { id: string }>({
  rows,
  columns,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  initialSort: { key: string; dir: 1 | -1 };
}) {
  const [sort, setSort] = useState(initialSort);
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : rows;
    if (!col?.sort) return filtered;
    const get = col.sort;
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [rows, columns, sort, query]);

  return (
    <Card className="p-0">
      <div className="border-b border-line p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.sort ? (
                    <button
                      onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : 1 }))}
                      className="hover:text-ink"
                    >
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
            {sorted.map((r) => (
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
      </div>
    </Card>
  );
}
