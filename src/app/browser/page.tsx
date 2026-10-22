import type { Metadata } from "next";
import { BrowserExplorer } from "@/components/browser/browser-explorer";
import { Badge } from "@/components/ui/badge";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";

export const metadata: Metadata = {
  title: "Gene & CpG Browser",
  description:
    "Query a gene, CpG probe, or GRCh38 interval against the CPGMoE Atlas synthetic demo panel.",
};

export default async function BrowserPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const eligibleIds = new Set(
    DEMO_DATASETS.filter((dataset) => !dataset.stages.excluded).map(
      (dataset) => dataset.dataset_id,
    ),
  );
  const eligibleCells = DEMO_CELLS.filter((cell) => eligibleIds.has(cell.dataset_id));

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Query</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
            Gene &amp; CpG Browser
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            Resolve a gene symbol, a CpG probe ID, or a GRCh38 interval to
            predefined demo panel records. Unknown queries return an explicit
            empty state.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone="neutral">Genome build GRCh38/hg38</Badge>
          <Badge tone="primary" dot>
            Synthetic demo
          </Badge>
        </div>
      </div>

      <div className="mt-5">
        <BrowserExplorer initialQuery={q ?? ""} cells={eligibleCells} />
      </div>
    </div>
  );
}
