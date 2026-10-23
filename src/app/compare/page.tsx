import type { Metadata } from "next";
import { CompareExplorer } from "@/components/compare/compare-explorer";
import { Badge } from "@/components/ui/badge";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";
import { DEFAULT_CPG_PANEL, CPG_BY_ID } from "@/mock/methylation";

export const metadata: Metadata = {
  title: "Compare groups",
  description:
    "Explore a synthetic delta predicted methylation comparison without inferential claims.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ groupA?: string; groupB?: string }>;
}) {
  const { groupA } = await searchParams;
  const eligibleDatasets = DEMO_DATASETS.filter((dataset) => !dataset.stages.excluded);
  const eligibleIds = new Set(eligibleDatasets.map((dataset) => dataset.dataset_id));
  const eligibleCells = DEMO_CELLS.filter((cell) => eligibleIds.has(cell.dataset_id));
  const cpgOptions = DEFAULT_CPG_PANEL.map((id) => CPG_BY_ID.get(id)).filter(
    (cpg): cpg is NonNullable<typeof cpg> => Boolean(cpg) && cpg?.annotation_status === "synthetic_window",
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
          initialGroupA={groupA}
        />
      </div>
    </div>
  );
}
