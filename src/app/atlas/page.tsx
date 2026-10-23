import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";
import { DEMO_CPGS } from "@/mock/methylation";

export const metadata: Metadata = {
  title: "Cell Atlas",
  description:
    "Interactive synthetic cell embedding and predicted methylation groups in the CPGMoE Atlas Phase 0 prototype.",
};

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ dataset?: string }>;
}) {
  const { dataset } = await searchParams;
  const eligibleDatasets = DEMO_DATASETS.filter((item) => !item.stages.excluded);
  const eligibleIds = new Set(eligibleDatasets.map((item) => item.dataset_id));
  const eligibleCells = DEMO_CELLS.filter((cell) => eligibleIds.has(cell.dataset_id));
  const cpgOptions = DEMO_CPGS.filter(
    (cpg) => cpg.annotation_status === "synthetic_window",
  );

  return (
    <div>
      <div className="shell pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Cell Atlas
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
              Synthetic embedding coloured by cell type, disease, or predicted
              methylation. Select cells to drive the linked summary.
            </p>
          </div>
          <p className="max-w-sm text-[11px] leading-relaxed text-ink-faint">
            Not a production atlas. The production view will use server-side
            aggregation and level-of-detail rendering, not raw million-point
            payloads.
          </p>
        </div>
      </div>
      <AtlasExplorer
        datasets={eligibleDatasets}
        cells={eligibleCells}
        cpgOptions={cpgOptions}
        initialDatasetId={dataset}
      />
    </div>
  );
}
