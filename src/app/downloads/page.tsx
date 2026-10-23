import type { Metadata } from "next";
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
    reason: "No production catalogue has been released. The audit is in progress.",
  },
  {
    icon: Table2,
    title: "Predicted CpG group summary",
    format: "Parquet · dataset × group × CpG",
    description:
      "Group-level predicted beta with cell counts, model/checkpoint hash, and provenance identifiers.",
    reason: "No production predictions available yet. No checkpoint has been run.",
  },
  {
    icon: FileJson,
    title: "Selected cell × CpG matrix",
    format: "CSV/Parquet · on demand",
    description:
      "Requested from a selection, capped and queued. Never a full atlas dump from the browser.",
    reason: "On-demand inference is not open in Phase 0.",
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
  ["is_synthetic_demo", "boolean", "True for every Phase 0 value.", "No"],
];

export default function DownloadsPage() {
  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Downloads &amp; API
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            Products unlock once audited data and predictions exist. The API
            contract is available now.
          </p>
        </div>
        <Badge tone="warm" dot>
          No production predictions available yet
        </Badge>
      </div>

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
                title="No production predictions available yet"
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
              Demo API
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
              Every response includes <span className="mono">data_mode: &quot;synthetic_demo&quot;</span>.
              These endpoints validate the contract; they are not a production
              service and do not load a model.
            </p>
          </div>
          <a
            href="/api/v1/status"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            Open status JSON
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
                Demo only
              </Badge>
            </div>
            <pre className="overflow-x-auto bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-paper">
{`GET /api/v1/status
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
                Preview endpoints
              </p>
              <Badge tone="warm" dot>
                Synthetic response
              </Badge>
            </div>
            <pre className="overflow-x-auto bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-paper">
{`POST /api/v1/preview/predictions
{ "dataset_id": "DEMO_LUNG_ADENO_01",
  "cpg_ids": ["cgDEMO0001"] }

POST /api/v1/preview/compare
{ "group_a": { "dimension": "tissue", "value": "Lung" },
  "group_b": { "dimension": "cell_type", "value": "T cell" },
  "cpg_ids": ["cgDEMO0001"] }

# Response always contains
"data_mode": "synthetic_demo"
"statistical_tests": "unavailable_in_demo"   # compare only`}
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
