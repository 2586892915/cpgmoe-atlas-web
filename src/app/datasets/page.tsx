import type { Metadata } from "next";
import { DatasetExplorer } from "@/components/datasets/dataset-explorer";
import { Badge } from "@/components/ui/badge";
import { ATLAS_FACETS } from "@/lib/atlas-provider";
import { DEMO_DATASETS } from "@/mock/datasets";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Search and filter synthetic demonstration datasets in the CPGMoE Atlas Phase 0 prototype.",
};

export default function DatasetsPage() {
  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Explore datasets
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
            Filter by tissue, disease, or assay, then open a record.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="primary" dot>
            {DEMO_DATASETS.length} synthetic records
          </Badge>
          <Badge tone="warm" dot>
            Audit in progress
          </Badge>
        </div>
      </div>

      <div className="mt-6 border border-line bg-white">
        <DatasetExplorer
          datasets={DEMO_DATASETS}
          tissues={ATLAS_FACETS.tissues}
          diseases={ATLAS_FACETS.diseases}
          assays={ATLAS_FACETS.assays}
        />
      </div>

      <div className="mt-4 grid gap-2 text-[12px] leading-relaxed text-ink-faint sm:grid-cols-2">
        <p>
          No row in this table corresponds to a real study. Dataset identifiers
          begin with <span className="mono">DEMO_</span>; source is always
          “Synthetic demo”.
        </p>
        <p className="sm:text-right">
          Pagination uses the same cursor contract as{" "}
          <span className="mono">GET /api/v1/datasets</span>. The table loads a
          local mock, not a production database.
        </p>
      </div>
    </div>
  );
}
