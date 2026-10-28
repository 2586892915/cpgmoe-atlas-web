import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import {
  getTissue,
  pilotRelease,
  tissueCpgs,
  tissueGroups,
} from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Tissue detail",
};

export default async function TissuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const name = decodeURIComponent(id);
  const tissue = getTissue(name);
  if (!tissue) notFound();
  const groups = tissueGroups(name);
  const cpgs = tissueCpgs(name, 16);

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/tissues" className="text-[11px] text-ink-faint hover:text-primary">
            ← All tissues
          </Link>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
            {humanize(tissue.tissue)}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {humanize(tissue.organ_system)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone="neutral">{tissue.n_groups} cell-type groups</Badge>
          <Badge tone="neutral">{pilotRelease.release_id}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-4">
        {[
          ["Cells", tissue.n_cells.toLocaleString("en-US")],
          ["Cell types", `${tissue.cell_types.length}`],
          ["Donors (max)", tissue.n_donors.toLocaleString("en-US")],
          ["Studies (max)", `${tissue.n_datasets}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[9px] uppercase text-ink-faint">{label}</p>
            <p className="tabular mt-1 text-[18px] font-medium leading-none text-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-end justify-between border-b border-line pb-2">
        <p className="micro-label">Cell-type groups in this tissue</p>
      </div>
      <div className="border-y border-line">
        <div className="hidden grid-cols-[1.8fr_0.6fr_0.5fr_0.5fr_auto] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
          <span>Cell type</span>
          <span className="text-right">Cells</span>
          <span className="text-right">Donors</span>
          <span className="text-right">Studies</span>
          <span />
        </div>
        {groups.slice(0, 40).map((group) => (
          <Link
            key={group.group_id}
            href={`/groups/${group.group_id}`}
            className="group grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint sm:grid-cols-[1.8fr_0.6fr_0.5fr_0.5fr_auto] sm:items-center sm:gap-3"
          >
            <span className="truncate text-[12px] font-medium text-ink group-hover:text-primary">
              {group.cell_type}
            </span>
            <span className="text-[10px] text-ink-faint sm:hidden">
              {group.n_cells.toLocaleString("en-US")} cells ·{" "}
              {group.n_donors.toLocaleString("en-US")} donors · {group.n_datasets}{" "}
              {group.n_datasets === 1 ? "study" : "studies"}
            </span>
            <span className="hidden tabular text-[11px] text-ink-soft sm:inline sm:text-right">
              {group.n_cells.toLocaleString("en-US")}
            </span>
            <span className="hidden tabular text-[11px] text-ink-soft sm:inline sm:text-right">
              {group.n_donors}
            </span>
            <span className="hidden tabular text-[11px] text-ink-soft sm:inline sm:text-right">
              {group.n_datasets}
            </span>
            <ArrowRight
              className="hidden h-3.5 w-3.5 text-ink-faint sm:block"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between border-b border-line pb-2">
        <div>
          <p className="micro-label">Tissue-level CpG shifts</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            Weighted mean over this tissue, ranked by |Δβ| vs the pan-panel mean.
          </p>
        </div>
      </div>
      <div className="border-y border-line">
        <div className="hidden grid-cols-[1.1fr_1.6fr_0.7fr_0.7fr] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
          <span>CpG</span>
          <span>Locus / gene</span>
          <span className="text-right">β tissue</span>
          <span className="text-right">Δβ</span>
        </div>
        {cpgs.map((cpg) => (
          <Link
            key={cpg.cpg_id}
            href={`/browser?q=${cpg.cpg_id}&cpg=${cpg.cpg_id}`}
            className="grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint sm:grid-cols-[1.1fr_1.6fr_0.7fr_0.7fr] sm:items-center sm:gap-3"
          >
            <span className="mono text-[11px] text-ink">{cpg.cpg_id}</span>
            <span className="truncate text-[11px] text-ink-soft">
              {cpg.chr && cpg.pos !== null
                ? `${cpg.chr}:${cpg.pos.toLocaleString("en-US")}`
                : "locus unavailable"}
              {cpg.genes ? ` · ${cpg.genes.split(";")[0]}` : ""}
            </span>
            <span className="tabular text-[11px] text-ink sm:text-right">
              {cpg.mean.toFixed(3)}
            </span>
            <span
              className={`tabular text-[11px] sm:text-right ${
                cpg.delta >= 0 ? "text-primary" : "text-warm"
              }`}
            >
              {cpg.delta >= 0 ? "+" : ""}
              {cpg.delta.toFixed(3)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
