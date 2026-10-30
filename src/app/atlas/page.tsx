import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { PanTissueAtlas } from "@/components/pilot/pan-tissue-atlas";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { pilotRelease } from "@/lib/pilot";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";
import { DEMO_CPGS } from "@/mock/methylation";

export const metadata: Metadata = {
  title: "Atlas",
  description:
    "Pilot pan-tissue predicted methylation atlas built from 3M-cell Full-S3 outputs.",
};

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ dataset?: string }>;
}) {
  const { dataset } = await searchParams;

  if (IS_PILOT) {
    return (
      <div className="shell py-8">
        <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Pan-tissue Atlas
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
              All 485,403 panel CpGs across 16 organ systems, in genome order.
              Choose a chromosome, then click a block to zoom to individual CpGs.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge tone="primary" dot>
              {pilotRelease.n_full_profile_cpgs.toLocaleString("en-US")} CpGs
            </Badge>
            <Badge tone="neutral">16 organ systems</Badge>
          </div>
        </div>

        <PanTissueAtlas />
      </div>
    );
  }

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
