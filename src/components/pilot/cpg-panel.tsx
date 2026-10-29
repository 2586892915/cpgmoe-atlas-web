"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileTabs } from "@/components/pilot/profile-tabs";
import type { PilotCpg, PilotCpgStat } from "@/lib/pilot";

type FullLevel = { id: "celltype" | "tissue" | "organ"; label: string; n_groups: number };

type CpgDetail = {
  cpg: Omit<PilotCpg, "panel_slot"> & { panel_slot: number | null };
  stats: PilotCpgStat | null;
  group_level_available: boolean;
  full_levels: FullLevel[];
  probe?: {
    global_mean_beta: number;
    total_variance: number;
    celltype_variance_fraction: number;
  };
  n_groups: number;
  high_confidence_groups: number;
  coverage_note: string | null;
};

function beta(value: number) {
  return value.toFixed(3);
}

function variance(value: number) {
  if (value === 0) return "0.0000";
  return value >= 0.001 ? value.toFixed(4) : value.toExponential(1);
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
    setDetail(null);
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
          Predicted β by cell type, tissue, organ, or tissue × cell type, with
          support counts for every group.
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

  const { cpg, stats } = detail;
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
  const fullCount = detail.full_levels.find((level) => level.id === "celltype")?.n_groups ?? 0;

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-[11px] text-ink-faint">
            {locus}
            {cpg.panel_slot !== null ? ` · slot ${cpg.panel_slot}` : ""}
          </p>
          <h3 className="mt-1 truncate text-[19px] font-semibold leading-tight text-ink">
            {genes[0] ?? "Unannotated CpG"}
          </h3>
          <p className="mono mt-1 text-[11px] text-ink-faint">{cpg.cpg_id}</p>
        </div>
        <Badge tone={detail.group_level_available ? "primary" : "neutral"} dot>
          {detail.group_level_available ? "panel + full" : "full panel"}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-ink-faint">
        {cpg.island_relation ? (
          <span className="border border-line px-1.5 py-0.5">{cpg.island_relation}</span>
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

      <dl className="mt-4 grid grid-cols-2 gap-px border border-line bg-line text-[11px]">
        {(detail.group_level_available
          ? [
              ["mean β", beta(stats?.mean ?? 0)],
              ["median", beta(stats?.median ?? 0)],
              ["range", `${beta(stats?.min ?? 0)}–${beta(stats?.max ?? 0)}`],
              ["tissue × type", `${detail.n_groups}`],
            ]
          : [
              ["global mean β", beta(detail.probe?.global_mean_beta ?? 0)],
              ["variance", variance(detail.probe?.total_variance ?? 0)],
              [
                "cell-type var.",
                `${((detail.probe?.celltype_variance_fraction ?? 0) * 100).toFixed(1)}%`,
              ],
              ["cell types", `${fullCount}`],
            ]
        ).map(([label, value]) => (
          <div key={label} className="bg-white px-2.5 py-2">
            <dt className="text-[9px] uppercase text-ink-faint">{label}</dt>
            <dd className="tabular mt-0.5 text-[12px] font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <ProfileTabs cpgId={cpg.cpg_id} levels={detail.full_levels} />

      <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-faint">
        <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        {detail.coverage_note ??
          "Predicted β · full-panel profiles by cell type, tissue, organ and tissue × cell type."}
      </p>
    </div>
  );
}
