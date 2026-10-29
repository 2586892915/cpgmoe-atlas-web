"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PilotCpgStat, PilotGroup } from "@/lib/pilot";

type LevelId = "celltype" | "tissue" | "organ" | "group";

type FullLevel = { id: "celltype" | "tissue" | "organ"; label: string; n_groups: number };

type ProfileRow = {
  label: string;
  beta: number;
  n_cells?: number;
  n_donors?: number;
  n_datasets?: number;
  href?: string;
};

type ApiItem = {
  group_index: number;
  label: string;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
  beta: number;
};

function histogram(values: number[]): number[] {
  const bins = Array(10).fill(0);
  for (const value of values) {
    bins[Math.min(9, Math.max(0, Math.floor(value * 10)))] += 1;
  }
  return bins;
}

export function ProfileTabs({
  cpgId,
  detail,
  levels,
}: {
  cpgId: string;
  detail: {
    stats: PilotCpgStat | null;
    group_level_available: boolean;
    n_groups: number;
    top_groups: { group: PilotGroup; beta: number; delta: number }[];
  };
  levels: FullLevel[];
}) {
  const [level, setLevel] = useState<LevelId>(levels[0]?.id ?? "celltype");
  const [rows, setRows] = useState<Record<string, ApiItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (level === "group" || rows[level]) return;
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

  const tabs: { id: LevelId; label: string; count: number }[] = [
    ...levels.map((entry) => ({ id: entry.id, label: entry.label, count: entry.n_groups })),
    ...(detail.group_level_available
      ? [{ id: "group" as LevelId, label: "Tissue × cell type", count: detail.n_groups }]
      : []),
  ];

  const items = level === "group" ? null : rows[level];
  const values = items?.map((item) => item.beta) ?? [];
  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const bins =
    level === "group"
      ? (detail.stats?.histogram ?? [])
      : items
        ? histogram(values)
        : [];
  const eligible = (items ?? []).filter((item) => item.n_cells >= 100);
  const pool = eligible.length >= 12 ? eligible : (items ?? []);
  const top: ProfileRow[] =
    level === "group"
      ? detail.top_groups.map((entry) => ({
          label: entry.group.cell_type,
          beta: entry.beta,
          n_cells: entry.group.n_cells,
          n_donors: entry.group.n_donors,
          n_datasets: entry.group.n_datasets,
          href: `/groups/${entry.group.group_id}`,
        }))
      : pool
          .map((item) => ({ ...item, delta: item.beta - mean }))
          .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
          .slice(0, 12)
          .map((item) => ({
            label: item.label,
            beta: item.beta,
            n_cells: item.n_cells,
            n_donors: item.n_donors,
            n_datasets: item.n_datasets,
            href:
              level === "celltype"
                ? `/cell-types/${item.group_index}`
                : level === "tissue"
                  ? `/tissues/${encodeURIComponent(item.label)}`
                  : `/tissues?organ=${encodeURIComponent(item.label)}`,
          }));

  const max = bins.length ? Math.max(...bins) : 0;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => (
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
            {tab.label} · {tab.count.toLocaleString("en-US")}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-warm">{error}</p>
      ) : loading && !items ? (
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
                <span>
                  β across{" "}
                  {level === "group"
                    ? detail.n_groups.toLocaleString("en-US")
                    : values.length.toLocaleString("en-US")}{" "}
                  groups
                </span>
                <span>1</span>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between">
            <p className="micro-label">
              {level === "group" ? "Top tissue × cell type" : "Top groups by |Δβ|"}
            </p>
            {level === "group" ? (
              <span className="text-[9px] text-ink-faint">512-CpG panel</span>
            ) : (
              <span className="text-[9px] text-ink-faint">
                full panel · groups with ≥100 cells
              </span>
            )}
          </div>

          <div className="mt-1 divide-y divide-line">
            {top.length === 0 ? (
              <p className="py-3 text-[11px] text-ink-faint">No values for this view.</p>
            ) : (
              top.map((row) => {
                const content = (
                  <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[12px] text-ink">
                      {row.label}
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-ink-soft">
                      {row.beta.toFixed(3)}
                    </span>
                  </div>
                  {row.n_cells !== undefined ? (
                    <p className="mt-0.5 text-[9px] text-ink-faint">
                      {row.n_cells.toLocaleString("en-US")} cells · {row.n_donors} donors ·{" "}
                      {row.n_datasets} {row.n_datasets === 1 ? "study" : "studies"}
                    </p>
                  ) : null}
                  <div className="mt-1 h-[3px] w-full bg-paper-deep">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, row.beta * 100)}%` }}
                    />
                  </div>
                  </>
                );
                return row.href ? (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="block py-2 transition-colors hover:bg-paper-tint"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={row.label} className="py-2">
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
