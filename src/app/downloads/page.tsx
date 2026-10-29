import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import {
  Code2,
  Database,
  Download,
  ExternalLink,
  FileJson,
  Info,
  Lock,
  Table2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { pilotRelease } from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Downloads & API",
  description:
    "Planned download products and the demo API contract for the CPGMoE Atlas Phase 0 prototype.",
};

const DOWNLOADS = [
  {
    icon: Database,
    title: "Dataset metadata",
    format: "TSV · one row per dataset",
    description:
      "Fields: dataset_id, tissue, disease, assay, status, evidence tier, licence status, audited cell count.",
    reason: IS_PILOT
      ? "Pilot aggregates are downloadable above; the audited catalogue is still pending."
      : "No production catalogue has been released. The audit is in progress.",
  },
  {
    icon: Table2,
    title: "Predicted CpG group summary",
    format: "Parquet · dataset × group × CpG",
    description:
      "Group-level predicted beta with cell counts, model/checkpoint hash, and provenance identifiers.",
    reason: IS_PILOT
      ? "Only the 512-CpG slice is published; the full 485,403 × 2,093 matrix is not."
      : "No production predictions available yet. No checkpoint has been run.",
  },
  {
    icon: FileJson,
    title: "Selected cell × CpG matrix",
    format: "CSV/Parquet · on demand",
    description:
      "Requested from a selection, capped and queued. Never a full atlas dump from the browser.",
    reason: "Per-cell predictions and raw RNA stay closed in every mode.",
  },
];

const FIELDS = [
  ["dataset_id", "string", "Stable dataset identifier; demo IDs start with DEMO_.", "No"],
  ["status", "enum", "Pipeline lifecycle state.", "No"],
  ["evidence_tier", "A | B | C | unverified", "Curator-assigned evidence quality tier.", "Yes"],
  ["n_cells", "integer", "Audited cell count; null until audit completion.", "Yes"],
  ["predicted_beta", "number [0,1]", "Predicted methylation beta, never a measured scDNAm value.", "No"],
  ["n_cells_aggregated", "integer", "Number of cells behind a group-level prediction.", "Yes"],
  ["provenance_id", "string", "Links a value to model, checkpoint, input, and audit records.", "No"],
  ["data_mode", "enum", "synthetic_demo | pilot_predicted.", "No"],
];

const PILOT_FILES = [
  {
    name: "groups.csv",
    label: "Tissue × cell-type groups",
    detail: "2,093 rows · tissue, cell type, organ, cells, donors, studies, high-confidence flag",
  },
  {
    name: "cpgs.csv",
    label: "512-CpG panel",
    detail: "hg38 chr/pos, island relation, gene, promoter, panel variance",
  },
  {
    name: "cpg_stats.csv",
    label: "Per-CpG distribution",
    detail: "mean, sd, min, p10, median, p90, max across 2,093 groups",
  },
  {
    name: "heatmap_organ_systems.csv",
    label: "Organ-system matrix",
    detail: "16 organ systems × 512 CpGs, cell-weighted mean predicted β",
  },
  {
    name: "release.json",
    label: "Release manifest",
    detail: "release id, counts, aggregation, checkpoint sha256, caveat",
  },
];

function sizeOf(name: string): string {
  try {
    const bytes = fs.statSync(path.join(process.cwd(), "public", "pilot", name)).size;
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;
  } catch {
    return "—";
  }
}

export default function DownloadsPage() {
  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Downloads &amp; API
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            {IS_PILOT
              ? "Aggregated pilot tables are available now. Per-cell and donor-level data stay closed."
              : "Products unlock once audited data and predictions exist. The API contract is available now."}
          </p>
        </div>
        <Badge tone={IS_PILOT ? "primary" : "warm"} dot>
          {IS_PILOT ? "Pilot aggregates downloadable" : "No production predictions available yet"}
        </Badge>
      </div>

      {IS_PILOT ? (
        <section className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-2">
            <p className="micro-label">Available now · {pilotRelease.release_id}</p>
            <p className="text-[10px] text-ink-faint">
              Aggregated predicted β · not measured methylation
            </p>
          </div>
          <div className="divide-y divide-line">
            {PILOT_FILES.map((file) => (
              <a
                key={file.name}
                href={`/pilot/${file.name}`}
                download
                className="group grid gap-1 py-3 transition-colors hover:bg-paper-tint sm:grid-cols-[1.1fr_1.7fr_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="text-[13px] font-medium text-ink group-hover:text-primary">
                  {file.label}
                </span>
                <span className="text-[11px] text-ink-soft">{file.detail}</span>
                <span className="mono text-[10px] text-ink-faint">{file.name}</span>
                <span className="flex items-center gap-2 text-[10px] text-ink-faint sm:justify-end">
                  <span className="tabular">{sizeOf(file.name)}</span>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-line bg-white px-4 py-3">
            <div>
              <p className="text-[12px] font-medium text-ink">
                Full panel · 485,403 CpGs
              </p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                569 cell types (276 MB) · 207 tissues (100 MB) · 16 organs (7.8 MB).
                uint8, CpG-major; offset = panel_index × n_groups.
              </p>
            </div>
            <a
              href="https://github.com/2586892915/cpgmoe-atlas-web/releases/tag/pilot-full450k-v1"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary shrink-0"
            >
              GitHub release
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </section>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {DOWNLOADS.map((product) => {
          const Icon = product.icon;
          return (
            <section key={product.title} className="panel flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center border border-line bg-paper-tint text-ink-soft">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <Badge tone="muted">Planned</Badge>
              </div>
              <h2 className="mt-3 text-[14px] font-semibold text-ink">{product.title}</h2>
              <p className="mono mt-0.5 text-[10px] text-ink-faint">{product.format}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{product.description}</p>
              <div className="mt-3 flex items-start gap-1.5 border border-line bg-paper-tint px-2 py-1.5 text-[10px] leading-relaxed text-ink-faint">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                {product.reason}
              </div>
              <button
                type="button"
                className="btn mt-3 w-full"
                disabled
                title="Not available in this release"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download unavailable
              </button>
            </section>
          );
        })}
      </div>

      <section className="mt-8" aria-labelledby="api-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Integration</p>
            <h2 id="api-heading" className="mt-1 text-[22px] font-semibold text-ink">
              {IS_PILOT ? "Pilot API" : "Demo API"}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
              {IS_PILOT ? (
                <>
                  Every response includes{" "}
                  <span className="mono">data_mode: &quot;pilot_predicted&quot;</span> and a
                  release id. The API serves aggregates only; it never runs inference.
                </>
              ) : (
                <>
                  Every response includes{" "}
                  <span className="mono">data_mode: &quot;synthetic_demo&quot;</span>. These
                  endpoints validate the contract and do not load a model.
                </>
              )}
            </p>
          </div>
          <a
            href={IS_PILOT ? "/api/v1/pilot/release" : "/api/v1/status"}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            {IS_PILOT ? "Open release JSON" : "Open status JSON"}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <Code2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Read endpoints
              </p>
              <Badge tone="primary" dot>
                {IS_PILOT ? "Pilot release" : "Demo only"}
              </Badge>
            </div>
            <pre className="overflow-x-auto bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-paper">
{IS_PILOT
  ? `GET /api/v1/pilot/release
GET /api/v1/pilot/search?q=
GET /api/v1/pilot/cpgs/{cpg_id}
GET /api/v1/pilot/groups?q=&tissue=&cell_type=&high_confidence=
GET /api/v1/pilot/groups/{id}
GET /api/v1/pilot/heatmap`
  : `GET /api/v1/status
GET /api/v1/datasets?search=&tissue=&cursor=&limit=
GET /api/v1/datasets/{id}
GET /api/v1/cpgs?query=&assembly=GRCh38
GET /api/v1/groups?dataset_id=&tissue=&cell_type=
GET /api/v1/models
GET /api/v1/schema`}
            </pre>
          </div>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <Code2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {IS_PILOT ? "Compare endpoint" : "Preview endpoints"}
              </p>
              <Badge tone="warm" dot>
                {IS_PILOT ? "Δβ only" : "Synthetic response"}
              </Badge>
            </div>
            <pre className="overflow-x-auto bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-paper">
{IS_PILOT
  ? `POST /api/v1/pilot/compare
{ "group_a": 0, "group_b": 141,
  "cpg_ids": ["cg26173773", "cg16698286"] }

# Response always contains
"data_mode": "pilot_predicted"
"release_id": "pilot_3m_20261024"
"statistical_tests": "unavailable"`
  : `POST /api/v1/preview/predictions
{ "dataset_id": "DEMO_LUNG_ADENO_01",
  "cpg_ids": ["cgDEMO0001"] }

POST /api/v1/preview/compare
{ "group_a": { "dimension": "tissue", "value": "Lung" },
  "group_b": { "dimension": "cell_type", "value": "T cell" },
  "cpg_ids": ["cgDEMO0001"] }

# Response always contains
"data_mode": "synthetic_demo"
"statistical_tests": "unavailable_in_demo"`}
            </pre>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="fields-heading">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 id="fields-heading" className="text-[18px] font-semibold text-ink">
              Field dictionary
            </h2>
            <p className="mt-1 text-[12px] text-ink-faint">
              Also available at <span className="mono">GET /api/v1/schema</span>.
            </p>
          </div>
          <Badge tone="neutral">Contract v1</Badge>
        </div>
        <div className="mt-3 panel overflow-x-auto">
          <table className="data-table min-w-[800px]">
            <caption className="sr-only">Field dictionary for the atlas API</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Type</th>
                <th scope="col">Description</th>
                <th scope="col">Nullable</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(([field, type, description, nullable]) => (
                <tr key={field}>
                  <td className="mono text-[11px] font-medium text-ink">{field}</td>
                  <td className="mono text-[10px]">{type}</td>
                  <td className="text-[12px]">{description}</td>
                  <td className="text-[11px]">{nullable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 flex items-start gap-2 border border-line bg-paper-tint px-3 py-2 text-[11px] text-ink-faint">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>
          Do not treat a 200 response as evidence that a prediction exists.
          Response bodies carry <span className="mono">checkpoint_loaded: false</span>{" "}
          and <span className="mono">is_synthetic_demo: true</span> for preview calls.
        </p>
      </div>
    </div>
  );
}
