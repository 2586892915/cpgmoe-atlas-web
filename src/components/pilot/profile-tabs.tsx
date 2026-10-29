"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type LevelId = "celltype" | "tissue" | "organ" | "tissue_celltype";

type FullLevel = { id: LevelId; label: string; n_groups: number };

type ApiItem = {
  group_index: number;
  label: string;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
  beta: number;
};

type Row = ApiItem & { href: string };

function histogram(values: number[]): number[] {
  const bins = Array(10).fill(0);
  for (const value of values) {
    bins[Math.min(9, Math.max(0, Math.floor(value * 10)))] += 1;
  }
  return bins;
}

function hrefFor(level: LevelId, item: ApiItem) {
  if (level === "celltype") return `/cell-types/${item.group_index}`;
  if (level === "tissue") return `/tissues/${encodeURIComponent(item.label)}`;
  if (level === "organ") return `/tissues?organ=${encodeURIComponent(item.label)}`;
  return `/groups/${item.group_index}`;
}

export function ProfileTabs({
  cpgId,
  levels,
}: {
  cpgId: string;
  levels: FullLevel[];
}) {
  const [level, setLevel] = useState<LevelId>(levels[0]?.id ?? "celltype");
  const [rows, setRows] = useState<Record<string, ApiItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rows[level]) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/pilot/cpgs/${encodeURIComponent(cpgId)}/profiles?level=${level}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "Profile unavailable");
        return payload.items as ApiItem[];
      })
      .then((items) => {
        if (!cancelled) setRows((current) => ({ ...current, [level]: items }));
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cpgId, level, rows]);

  const items = rows[level] ?? [];
  const values = items.map((item) => item.beta);
  const mean = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const bins = items.length ? histogram(values) : [];
  const max = bins.length ? Math.max(...bins) : 0;

  const eligible = items.filter((item) => item.n_cells >= 100);
  const pool = eligible.length >= 12 ? eligible : items;
  const top: Row[] = pool
    .map((item) => ({ ...item, href: hrefFor(level, item) }))
    .sort((left, right) => Math.abs(right.beta - mean) - Math.abs(left.beta - mean))
    .slice(0, 12);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-1">
        {levels.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setLevel(tab.id)}
            className={`border px-2 py-1 text-[10px] transition-colors ${
              level === tab.id
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-ink-soft hover:border-primary/40"
            }`}
          >
            {tab.label} · {tab.n_groups.toLocaleString("en-US")}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-warm">{error}</p>
      ) : loading && items.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-faint">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Loading profile
        </div>
      ) : (
        <>
          {bins.length ? (
            <div className="mt-3">
              <div className="flex h-10 items-end gap-[2px]">
                {bins.map((count, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/70"
                    style={{ height: `${max ? (count / max) * 100 : 0}%` }}
                    title={`${(index / 10).toFixed(1)}–${((index + 1) / 10).toFixed(1)}: ${count}`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-ink-faint">
                <span>0</span>
                <span>β across {values.length.toLocaleString("en-US")} groups</span>
                <span>1</span>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between">
            <p className="micro-label">Top groups by |Δβ|</p>
            <span className="text-[9px] text-ink-faint">
              full panel · groups with ≥100 cells
            </span>
          </div>

          <div className="mt-1 divide-y divide-line">
            {top.length === 0 ? (
              <p className="py-3 text-[11px] text-ink-faint">No values for this view.</p>
            ) : (
              top.map((row) => (
                <Link
                  key={`${row.group_index}-${row.label}`}
                  href={row.href}
                  className="block py-2 transition-colors hover:bg-paper-tint"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[12px] text-ink">
                      {row.label}
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-ink-soft">
                      {row.beta.toFixed(3)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-ink-faint">
                    {row.n_cells.toLocaleString("en-US")} cells · {row.n_donors} donors ·{" "}
                    {row.n_datasets} {row.n_datasets === 1 ? "study" : "studies"}
                  </p>
                  <div className="mt-1 h-[3px] w-full bg-paper-deep">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, row.beta * 100)}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
