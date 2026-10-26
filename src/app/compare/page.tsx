import type { Metadata } from "next";
import Link from "next/link";
import { CompareExplorer } from "@/components/compare/compare-explorer";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import {
  compareGroups,
  getGroup,
  highVarianceCpgs,
  listGroups,
  pilotRelease,
} from "@/lib/pilot";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";
import { DEFAULT_CPG_PANEL, CPG_BY_ID } from "@/mock/methylation";

export const metadata: Metadata = {
  title: "Compare groups",
  description:
    "Compare aggregated predicted methylation between two tissue and cell-type groups.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ groupA?: string; a?: string; b?: string }>;
}) {
  const { groupA, a, b } = await searchParams;

  if (IS_PILOT) {
    const groups = [...listGroups()].sort((x, y) => y.n_cells - x.n_cells);
    const options = groups.slice(0, 200);
    const defaultA = Number(a) || groups[0]?.group_id;
    const defaultB =
      Number(b) ||
      groups.find((group) => group.tissue !== groups[0]?.tissue)?.group_id;
    const groupAInfo = defaultA !== undefined ? getGroup(defaultA) : null;
    const groupBInfo = defaultB !== undefined ? getGroup(defaultB) : null;
    const panel = highVarianceCpgs(24);
    const rows =
      groupAInfo && groupBInfo
        ? (compareGroups(
            groupAInfo.group_id,
            groupBInfo.group_id,
            panel.map((cpg) => cpg.cpg_id),
          ) ?? [])
        : [];

    const ensureOption = (id: number | undefined) =>
      id !== undefined && !options.some((group) => group.group_id === id)
        ? getGroup(id)
        : null;
    const extraA = ensureOption(defaultA);
    const extraB = ensureOption(defaultB);

    return (
      <div className="shell py-8">
        <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Compare groups
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
              Mean predicted β for two tissue × cell-type groups over the 24
              highest-variance pilot CpGs. Δβ = A − B; no statistics are computed.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge tone="warm" dot>
              No inferential statistics
            </Badge>
            <Badge tone="neutral">{pilotRelease.release_id}</Badge>
          </div>
        </div>

        <form action="/compare" className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="micro-label">Group A</span>
            <select
              name="a"
              defaultValue={defaultA}
              className="mt-1 h-10 w-full border border-line bg-white px-2 text-[12px] text-ink outline-none focus:border-primary"
            >
              {extraA ? (
                <option value={extraA.group_id}>
                  {extraA.tissue} · {extraA.cell_type}
                </option>
              ) : null}
              {options.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.tissue} · {group.cell_type} ({group.n_cells.toLocaleString("en-US")})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="micro-label">Group B</span>
            <select
              name="b"
              defaultValue={defaultB}
              className="mt-1 h-10 w-full border border-line bg-white px-2 text-[12px] text-ink outline-none focus:border-primary"
            >
              {extraB ? (
                <option value={extraB.group_id}>
                  {extraB.tissue} · {extraB.cell_type}
                </option>
              ) : null}
              {options.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.tissue} · {group.cell_type} ({group.n_cells.toLocaleString("en-US")})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-10 bg-primary px-5 text-[12px] font-semibold text-white hover:bg-primary-dark"
            style={{ borderRadius: 3 }}
          >
            Compare
          </button>
        </form>
        <p className="mt-2 text-[10px] text-ink-faint">
          Selects list the 200 largest groups; open a group page to compare it
          from there.
        </p>

        {groupAInfo && groupBInfo ? (
          <>
            <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2">
              {[groupAInfo, groupBInfo].map((group, index) => (
                <div key={group.group_id} className="bg-white px-4 py-3">
                  <p className="text-[9px] uppercase text-ink-faint">
                    {index === 0 ? "A" : "B"} · {group.tissue}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-ink">
                    {group.cell_type}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-faint">
                    {group.n_cells.toLocaleString("en-US")} cells · {group.n_donors} donors ·{" "}
                    {group.n_datasets} {group.n_datasets === 1 ? "study" : "studies"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-y border-line">
              <div className="hidden grid-cols-[1.1fr_1.5fr_0.6fr_0.6fr_0.7fr] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint md:grid">
                <span>CpG</span>
                <span>Locus / gene</span>
                <span className="text-right">β A</span>
                <span className="text-right">β B</span>
                <span className="text-right">Δβ (A−B)</span>
              </div>
              {rows.map((row) => (
                <Link
                  key={row.cpg_id}
                  href={`/browser?q=${row.cpg_id}`}
                  className="grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint md:grid-cols-[1.1fr_1.5fr_0.6fr_0.6fr_0.7fr] md:items-center md:gap-3"
                >
                  <span className="mono text-[11px] text-ink">{row.cpg_id}</span>
                  <span className="truncate text-[11px] text-ink-soft">
                    {row.chr && row.pos !== null
                      ? `${row.chr}:${row.pos.toLocaleString("en-US")}`
                      : "locus unavailable"}
                    {row.genes ? ` · ${row.genes.split(";")[0]}` : ""}
                  </span>
                  <span className="tabular text-[11px] text-ink md:text-right">
                    {row.mean_beta_a.toFixed(3)}
                  </span>
                  <span className="tabular text-[11px] text-ink md:text-right">
                    {row.mean_beta_b.toFixed(3)}
                  </span>
                  <span
                    className={`tabular text-[11px] md:text-right ${
                      row.delta_beta >= 0 ? "text-primary" : "text-warm"
                    }`}
                  >
                    {row.delta_beta >= 0 ? "+" : ""}
                    {row.delta_beta.toFixed(3)}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-ink-faint">
              Groups differ in study coverage ({groupAInfo.n_datasets} vs{" "}
              {groupBInfo.n_datasets} studies), so Δβ is descriptive only.
              Study effects are not separable at this level.
            </p>
          </>
        ) : null}
      </div>
    );
  }

  const { groupA: legacyGroupA } = { groupA };
  const eligibleDatasets = DEMO_DATASETS.filter((dataset) => !dataset.stages.excluded);
  const eligibleIds = new Set(eligibleDatasets.map((dataset) => dataset.dataset_id));
  const eligibleCells = DEMO_CELLS.filter((cell) => eligibleIds.has(cell.dataset_id));
  const cpgOptions = DEFAULT_CPG_PANEL.map((id) => CPG_BY_ID.get(id)).filter(
    (cpg): cpg is NonNullable<typeof cpg> =>
      Boolean(cpg) && cpg?.annotation_status === "synthetic_window",
  );

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Compare groups
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            Two-group Δ predicted methylation. Aggregation demo, not biological
            inference.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge tone="warm" dot>
            No inferential statistics
          </Badge>
          <Badge tone="primary" dot>
            Synthetic demo
          </Badge>
        </div>
      </div>

      <div className="mt-5">
        <CompareExplorer
          datasets={eligibleDatasets}
          cells={eligibleCells}
          cpgOptions={cpgOptions}
          initialGroupA={legacyGroupA}
        />
      </div>
    </div>
  );
}
