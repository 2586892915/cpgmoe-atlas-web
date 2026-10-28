import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import { getGroup, pilotRelease, topCpgsForGroup } from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Group detail",
};

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();
  const group = getGroup(groupId);
  if (!group) notFound();
  const topCpgs = topCpgsForGroup(groupId, 30);

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/groups" className="text-[11px] text-ink-faint hover:text-primary">
            ← All groups
          </Link>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
            {group.cell_type}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            <Link
              href={`/tissues/${encodeURIComponent(group.tissue)}`}
              className="hover:text-primary"
            >
              {group.tissue}
            </Link>{" "}
            · {humanize(group.organ_system)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {group.high_confidence ? (
            <Badge tone="primary" dot>
              High-confidence group
            </Badge>
          ) : (
            <Badge tone="warm" dot>
              Exploratory support
            </Badge>
          )}
          <Badge tone="neutral">{pilotRelease.release_id}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-4">
        {[
          ["Cells", group.n_cells.toLocaleString("en-US")],
          ["Donors", `${group.n_donors}`],
          ["Studies", `${group.n_datasets}`],
          ["Profiled CpGs", `${pilotRelease.n_profiled_cpgs}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[9px] uppercase text-ink-faint">{label}</p>
            <p className="tabular mt-1 text-[18px] font-medium leading-none text-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between border-b border-line pb-2">
        <div>
          <p className="micro-label">Candidate signature CpGs</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            Ranked by |β − panel mean| across the 512-CpG pilot panel.
          </p>
        </div>
        <Link
          href={`/compare?a=${group.group_id}`}
          className="text-[11px] text-primary hover:underline"
        >
          Compare this group →
        </Link>
      </div>

      <div className="mt-2 border-y border-line">
        <div className="hidden grid-cols-[1.1fr_1.6fr_0.8fr_0.6fr_0.6fr_auto] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint md:grid">
          <span>CpG</span>
          <span>Locus / gene</span>
          <span className="text-right">β</span>
          <span className="text-right">Panel mean</span>
          <span className="text-right">Δβ</span>
          <span />
        </div>
        {topCpgs.map((cpg) => (
          <Link
            key={cpg.cpg_id}
            href={`/browser?q=${cpg.cpg_id}`}
            className="group grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint md:grid-cols-[1.1fr_1.6fr_0.8fr_0.6fr_0.6fr_auto] md:items-center md:gap-3"
          >
            <span className="mono text-[11px] text-ink">{cpg.cpg_id}</span>
            <span className="truncate text-[11px] text-ink-soft">
              {cpg.chr && cpg.pos !== null
                ? `${cpg.chr}:${cpg.pos.toLocaleString("en-US")}`
                : "locus unavailable"}
              {cpg.genes ? ` · ${cpg.genes.split(";")[0]}` : ""}
            </span>
            <span className="tabular text-[11px] text-ink md:text-right">
              {cpg.beta.toFixed(3)}
            </span>
            <span className="tabular text-[11px] text-ink-faint md:text-right">
              {cpg.reference.toFixed(3)}
            </span>
            <span
              className={`tabular text-[11px] md:text-right ${
                cpg.delta >= 0 ? "text-primary" : "text-warm"
              }`}
            >
              {cpg.delta >= 0 ? "+" : ""}
              {cpg.delta.toFixed(3)}
            </span>
            <ArrowRight
              className="hidden h-3.5 w-3.5 text-ink-faint md:block"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-ink-faint">
        Candidate predicted differences, not validated markers. Support:{" "}
        {group.n_datasets} {group.n_datasets === 1 ? "study" : "studies"} /{" "}
        {group.n_donors} donors.
      </p>
    </div>
  );
}
