import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Dna,
  ExternalLink,
  GitCompare,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { getDemoDataset } from "@/mock/datasets";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = getDemoDataset(id);
  return {
    title: dataset ? dataset.title : "Dataset not found",
    description: dataset?.summary,
  };
}

function Stage({
  label,
  active,
  negative = false,
}: {
  label: string;
  active: boolean;
  negative?: boolean;
}) {
  const tone = negative
    ? active
      ? "border-warm/40 bg-warm-wash text-warm"
      : "border-line bg-white text-ink-faint"
    : active
      ? "border-rna/30 bg-rna-wash text-rna"
      : "border-line bg-white text-ink-faint";
  return (
    <div className={`flex items-center gap-2 border px-3 py-2 ${tone}`} style={{ borderRadius: 3 }}>
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          active ? "border-current" : "border-line-strong"
        }`}
        aria-hidden="true"
      >
        {active ? (
          negative ? (
            <X className="h-2.5 w-2.5" />
          ) : (
            <Check className="h-2.5 w-2.5" />
          )
        ) : null}
      </span>
      <span className="text-[12px] font-medium">{label}</span>
      <span className="ml-auto text-[10px] uppercase">
        {active ? (negative ? "flagged" : "yes") : "no"}
      </span>
    </div>
  );
}

export default async function DatasetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const dataset = getDemoDataset(id);
  if (!dataset) notFound();

  const facts = [
    ["Tissue", dataset.tissue ?? "—"],
    ["Disease", dataset.disease ?? "—"],
    ["Assay", dataset.assay ?? "—"],
    ["Species", dataset.species],
    ["Cells (illustrative)", dataset.n_cells ? `≈${dataset.n_cells.toLocaleString("en-US")}` : "—"],
    ["Donors (illustrative)", dataset.n_donors ? String(dataset.n_donors) : "—"],
  ];

  return (
    <div className="shell py-7">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-ink-faint">
        <Link href="/datasets" className="hover:text-primary">
          Datasets
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="mono text-ink-soft">{dataset.dataset_id}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={dataset.status} />
            <Badge tone="neutral">Evidence tier {dataset.evidence_tier ?? "unverified"}</Badge>
            <Badge tone={dataset.license_status === "approved" ? "rna" : "warm"}>
              Licence {dataset.license_status}
            </Badge>
            <Badge tone="primary" dot>
              Synthetic demo
            </Badge>
          </div>
          <h1 className="mt-3 max-w-3xl text-[27px] font-semibold leading-tight text-ink">
            {dataset.title}
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            {dataset.summary}
          </p>
          <p className="mono mt-2 text-[11px] text-ink-faint">
            {dataset.dataset_id} · collection {dataset.collection_id ?? "—"} ·{" "}
            {dataset.species}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link className="btn btn-primary" href={`/atlas?dataset=${dataset.dataset_id}`}>
            <Dna className="h-4 w-4" aria-hidden="true" />
            View cells
          </Link>
          <Link className="btn btn-secondary" href={`/compare?groupA=${dataset.dataset_id}`}>
            <GitCompare className="h-4 w-4" aria-hidden="true" />
            Compare
          </Link>
          <a
            className="btn btn-secondary"
            href={`/api/v1/datasets/${dataset.dataset_id}`}
            target="_blank"
            rel="noreferrer"
          >
            API
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <dl className="panel mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-3">
            <dt className="text-[11px] uppercase text-ink-faint">{label}</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6" aria-labelledby="stage-heading">
        <div className="flex items-center justify-between">
          <h2 id="stage-heading" className="text-[13px] font-semibold text-ink">
            Pipeline stage
          </h2>
          <span className="text-[11px] text-ink-faint">
            Flags are illustrative UI states, not audit results
          </span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Stage label="Indexed" active={dataset.stages.indexed} />
          <Stage label="RNA-QC passed" active={dataset.stages.rna_qc_passed} />
          <Stage label="Encoded" active={dataset.stages.encoded} />
          <Stage label="Predicted" active={dataset.stages.predicted} />
          <Stage label="Excluded" active={dataset.stages.excluded} negative />
        </div>
      </section>

      {dataset.stages.excluded ? (
        <div className="mt-4 flex items-start gap-2 border border-warm/30 bg-warm-wash px-3 py-2.5 text-[12px] text-warm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            This record is excluded in the demo UI. Prediction previews are
            blocked for excluded datasets, and no data would be served publicly.
          </span>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-5">
          <section className="panel p-4" aria-labelledby="metadata-heading">
            <h2 id="metadata-heading" className="text-[14px] font-semibold text-ink">
              Metadata
            </h2>
            <dl className="mt-3 divide-y divide-line text-[13px]">
              {[
                ["Dataset ID", dataset.dataset_id],
                ["Collection", dataset.collection_id ?? "—"],
                ["Status", dataset.status],
                ["Evidence tier", dataset.evidence_tier ?? "unverified"],
                ["Licence status", dataset.license_status ?? "—"],
                ["Cell count", `${dataset.n_cells?.toLocaleString("en-US")} (illustrative)`],
                ["Donor count", `${dataset.n_donors} (illustrative)`],
                ["Source URL", "None — synthetic record"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[150px_1fr] gap-3 py-2">
                  <dt className="text-ink-faint">{label}</dt>
                  <dd className="text-ink-soft">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel p-4" aria-labelledby="labels-heading">
            <h2 id="labels-heading" className="text-[14px] font-semibold text-ink">
              Label dictionary
            </h2>
            <p className="mt-1 text-[12px] text-ink-faint">
              Status vocabulary used across the portal and API.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="data-table min-w-[560px]">
                <thead>
                  <tr>
                    <th scope="col">Label</th>
                    <th scope="col">Meaning</th>
                    <th scope="col">This record</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Indexed", "File inventory and metadata registered", dataset.stages.indexed],
                    ["RNA-QC passed", "Demonstration QC threshold cleared", dataset.stages.rna_qc_passed],
                    ["Encoded", "A latent representation would exist", dataset.stages.encoded],
                    ["Predicted", "CPGMoE output would be available", dataset.stages.predicted],
                    ["Excluded", "Blocked by licence or eligibility", dataset.stages.excluded],
                  ].map(([label, meaning, value]) => (
                    <tr key={String(label)}>
                      <td className="font-medium text-ink">{label}</td>
                      <td className="text-[12px]">{meaning}</td>
                      <td>
                        {value ? (
                          <Badge tone="rna" dot>set</Badge>
                        ) : (
                          <Badge tone="muted">not set</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-4" aria-labelledby="qc-heading">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="qc-heading" className="text-[14px] font-semibold text-ink">
                  RNA QC
                </h2>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  Illustrative values, not measured from a real file
                </p>
              </div>
              <Badge tone="warm" dot>
                Placeholder
              </Badge>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-ink-soft">RNA-QC pass rate</span>
                  <span className="tabular font-semibold text-ink">
                    {dataset.qc.rna_qc_pass_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-paper-deep" role="img" aria-label={`${dataset.qc.rna_qc_pass_rate} percent pass rate`}>
                  <div
                    className="h-2 bg-rna"
                    style={{ width: `${dataset.qc.rna_qc_pass_rate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-ink-soft">Doublet rate</span>
                  <span className="tabular font-semibold text-ink">
                    {dataset.qc.doublet_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-paper-deep" role="img" aria-label={`${dataset.qc.doublet_rate} percent doublet rate`}>
                  <div
                    className="h-2 bg-warm"
                    style={{ width: `${Math.min(dataset.qc.doublet_rate * 8, 100)}%` }}
                  />
                </div>
              </div>
              <div className="panel-inset px-3 py-2">
                <p className="text-[11px] text-ink-faint">Median genes</p>
                <p className="tabular text-[17px] font-semibold text-ink">
                  {dataset.qc.median_genes.toLocaleString("en-US")}
                </p>
              </div>
              <div className="panel-inset px-3 py-2">
                <p className="text-[11px] text-ink-faint">Median UMIs</p>
                <p className="tabular text-[17px] font-semibold text-ink">
                  {dataset.qc.median_umi.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid content-start gap-5">
          <section className="panel p-4" aria-labelledby="applicability-heading">
            <h2 id="applicability-heading" className="text-[14px] font-semibold text-ink">
              Model applicability
            </h2>
            <ul className="mt-2 grid gap-2 text-[12px] leading-relaxed text-ink-soft">
              {dataset.model_applicability.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4" aria-labelledby="provenance-heading">
            <h2 id="provenance-heading" className="text-[14px] font-semibold text-ink">
              Provenance
            </h2>
            <dl className="mt-2 divide-y divide-line text-[12px]">
              {dataset.provenance.map((row) => (
                <div key={row.label} className="grid gap-0.5 py-2">
                  <dt className="text-[10px] uppercase text-ink-faint">{row.label}</dt>
                  <dd className="text-ink-soft">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel p-4" aria-labelledby="usage-heading">
            <h2 id="usage-heading" className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              Data use
              <Info className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
              {dataset.usage_note}
            </p>
          </section>

          <section className="panel p-4" aria-labelledby="limitations-heading">
            <h2 id="limitations-heading" className="text-[14px] font-semibold text-ink">
              Limitations
            </h2>
            <ul className="mt-2 grid gap-2 text-[12px] leading-relaxed text-ink-soft">
              {dataset.limitations.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warm" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          Synthetic demonstration record. No real human data, donor identity, or
          model prediction is represented.
        </p>
        <a
          className="link-quiet inline-flex items-center gap-1"
          href={`/api/v1/datasets/${dataset.dataset_id}`}
          target="_blank"
          rel="noreferrer"
        >
          View JSON contract
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
