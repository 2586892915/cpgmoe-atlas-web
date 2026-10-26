"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PilotCpg, PilotCpgStat, PilotGroup } from "@/lib/pilot";

type CpgDetail = {
  cpg: PilotCpg;
  stats: PilotCpgStat | null;
  n_groups: number;
  high_confidence_groups: number;
  top_groups: { group: PilotGroup; beta: number; delta: number }[];
  coverage_note: string;
};

function beta(value: number) {
  return value.toFixed(3);
}

export function CpgPanel({ cpgId }: { cpgId: string | null }) {
  const [detail, setDetail] = useState<CpgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cpgId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/pilot/cpgs/${encodeURIComponent(cpgId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "Request failed");
        return payload as CpgDetail;
      })
      .then((payload) => {
        if (!cancelled) setDetail(payload);
      })
      .catch((cause: Error) => {
        if (!cancelled) {
          setError(cause.message);
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cpgId]);

  if (!cpgId) {
    return (
      <div className="panel flex min-h-[320px] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[13px] font-medium text-ink">Select a CpG</p>
        <p className="max-w-xs text-[12px] leading-relaxed text-ink-faint">
          Group-level predicted β, support counts and links to the matching
          tissue / cell-type records.
        </p>
      </div>
    );
  }

  if (loading && !detail) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center gap-2 text-[12px] text-ink-faint">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading probe
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="panel px-5 py-6">
        <p className="text-[13px] font-medium text-warm">Probe unavailable</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{error}</p>
      </div>
    );
  }

  const { cpg, stats, top_groups: topGroups } = detail;
  const genes = Array.from(
    new Set(
      (cpg.genes ?? "")
        .split(";")
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );
  const locus =
    cpg.chr && cpg.pos !== null
      ? `${cpg.chr}:${cpg.pos.toLocaleString("en-US")}`
      : "locus unavailable";

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-[11px] text-ink-faint">
            {locus} · panel slot {cpg.panel_slot}
          </p>
          <h3 className="mt-1 truncate text-[19px] font-semibold leading-tight text-ink">
            {genes[0] ?? "Unannotated CpG"}
          </h3>
          <p className="mono mt-1 text-[11px] text-ink-faint">{cpg.cpg_id}</p>
        </div>
        <Badge tone="primary" dot>
          predicted β
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-ink-faint">
        {cpg.island_relation ? (
          <span className="border border-line px-1.5 py-0.5">
            {cpg.island_relation}
          </span>
        ) : null}
        {cpg.promoter ? (
          <span className="border border-line px-1.5 py-0.5">{cpg.promoter}</span>
        ) : null}
        {genes.length > 0 ? (
          <span className="border border-line px-1.5 py-0.5">
            {genes.slice(0, 3).join(" · ")}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-px border border-line bg-line text-[11px]">
        {[
          ["mean β", beta(stats?.mean ?? 0)],
          ["median", beta(stats?.median ?? 0)],
          ["range", `${beta(stats?.min ?? 0)}–${beta(stats?.max ?? 0)}`],
          ["groups", `${detail.n_groups}`],
          ["high conf.", `${detail.high_confidence_groups}`],
          ["panel", `${cpg.panel_slot} / 512`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-2.5 py-2">
            <dt className="text-[9px] uppercase text-ink-faint">{label}</dt>
            <dd className="tabular mt-0.5 text-[12px] font-medium text-ink">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-center justify-between">
        <p className="micro-label">Top groups by |Δβ|</p>
        <span className="text-[10px] text-ink-faint">
          high-confidence groups only
        </span>
      </div>

      <div className="mt-2 divide-y divide-line">
        {topGroups.length === 0 ? (
          <p className="py-4 text-[12px] text-ink-faint">
            No group passes the support threshold for this probe.
          </p>
        ) : (
          topGroups.map(({ group, beta: value, delta }) => (
            <Link
              key={group.group_id}
              href={`/groups/${group.group_id}`}
              className="group block py-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[12px] text-ink group-hover:text-primary">
                  {group.cell_type}
                </span>
                <span className="tabular shrink-0 text-[11px] text-ink-soft">
                  {beta(value)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[10px] text-ink-faint">
                  {group.tissue}
                </span>
                <span
                  className={`tabular text-[10px] ${
                    delta >= 0 ? "text-primary" : "text-warm"
                  }`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-[3px] w-full bg-paper-deep">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
            </Link>
          ))
        )}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-faint">
        <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        {detail.coverage_note}
      </p>
    </div>
  );
}
