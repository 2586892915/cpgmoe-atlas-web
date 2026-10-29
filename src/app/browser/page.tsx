import type { Metadata } from "next";
import { BrowserExplorer } from "@/components/browser/browser-explorer";
import { PilotBrowser } from "@/components/pilot/browser-explorer";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { searchPilot } from "@/lib/pilot";
import {
  PROFILED_COUNT,
  PROBE_COUNT,
  searchProbes,
  toSearchCpg,
} from "@/lib/probes";
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
  searchParams: Promise<{ q?: string; cpg?: string }>;
}) {
  const { q, cpg } = await searchParams;

  if (IS_PILOT) {
    const query = q ?? "";
    const probes = searchProbes(query);
    const results = {
      query,
      query_type: probes.query_type,
      cpgs: probes.items.map(toSearchCpg),
      groups: query.trim() ? searchPilot(query).groups : [],
      gene: null,
      region: null,
      truncated: probes.total > 40,
      total: probes.total,
      coverage: {
        indexed_probes: PROBE_COUNT,
        profiled_cpgs: PROFILED_COUNT,
      },
    };
    return (
      <div className="shell py-8">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Gene &amp; CpG Browser
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
              Search all {PROBE_COUNT.toLocaleString("en-US")} probes. Predicted β
              is available by cell type, tissue and organ; tissue × cell type
              covers {PROFILED_COUNT} CpGs.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge tone="neutral">GRCh38 / hg38</Badge>
            <Badge tone="warm" dot>
              485K probes · full-panel β
            </Badge>
          </div>
        </div>

        <div className="mt-5">
          <PilotBrowser
            initialQuery={query}
            initialResults={results}
            suggestedCpg={cpg ?? results.cpgs[0]?.cpg_id ?? null}
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
