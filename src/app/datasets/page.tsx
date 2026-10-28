import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DatasetExplorer } from "@/components/datasets/dataset-explorer";
import { Badge } from "@/components/ui/badge";
import { ATLAS_FACETS } from "@/lib/atlas-provider";
import { IS_PILOT } from "@/lib/data-mode";
import { DEMO_DATASETS } from "@/mock/datasets";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Search and filter synthetic demonstration datasets in the CPGMoE Atlas Phase 0 prototype.",
};

export default function DatasetsPage() {
  if (IS_PILOT) redirect("/tissues");
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
          <span className="mono">DEMO_</span> records are synthetic; none
          corresponds to a real study.
        </p>
        <p className="sm:text-right">
          Local mock, not a production database.
        </p>
      </div>
    </div>
  );
}
