import type { Metadata } from "next";
import { BrowserExplorer } from "@/components/browser/browser-explorer";
import { PilotBrowser } from "@/components/pilot/browser-explorer";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { pilotRelease, searchPilot } from "@/lib/pilot";
import { DEMO_CELLS } from "@/mock/cells";
import { DEMO_DATASETS } from "@/mock/datasets";

export const metadata: Metadata = {
  title: "Gene & CpG Browser",
  description:
    "Query a gene, CpG probe, or GRCh38 interval against the CPGMoE pilot panel.",
};

export default async function BrowserPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (IS_PILOT) {
    const query = q ?? "";
    const results = searchPilot(query);
    return (
      <div className="shell py-8">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Gene &amp; CpG Browser
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
              Search the piloted 512-CpG panel by gene, probe, or GRCh38
              interval, then open group-level predicted β.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge tone="neutral">GRCh38 / hg38</Badge>
            <Badge tone="warm" dot>
              Pilot · {pilotRelease.n_profiled_cpgs} CpGs
            </Badge>
          </div>
        </div>

        <div className="mt-5">
          <PilotBrowser
            initialQuery={query}
            initialResults={results}
            suggestedCpg={results.cpgs[0]?.cpg_id ?? null}
          />
        </div>
      </div>
    );
  }

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
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Gene &amp; CpG Browser
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            Resolve a gene, CpG probe, or GRCh38 interval.
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
