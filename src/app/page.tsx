import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { CinematicHero } from "@/components/home/cinematic-hero";
import { VisualTeaser } from "@/components/home/visual-teaser";
import { GlobalSearch } from "@/components/global-search";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DemoValue } from "@/components/ui/demo-value";
import { MODEL_EVIDENCE_NOTE } from "@/lib/data-mode";
import { DEMO_DATASETS } from "@/mock/datasets";

const ENTRIES = [
  {
    href: "/atlas",
    title: "Cell Atlas",
    description: "Synthetic embedding, cell selection, and linked predicted methylation.",
  },
  {
    href: "/browser",
    title: "Gene & CpG Browser",
    description: "Resolve a gene, probe ID, or GRCh38 interval to panel records.",
  },
  {
    href: "/compare",
    title: "Compare Groups",
    description: "Two-group Δ predicted methylation layout with no inferential claims.",
  },
  {
    href: "/downloads",
    title: "Downloads & API",
    description: "Field dictionary, API contract, and the planned data products.",
  },
];

const METRICS = [
  {
    value: "450K",
    label: "panel CpG target space",
    note: "A defined Illumina 450K panel, not a genome-wide claim.",
    tone: "primary" as const,
  },
  {
    value: "12",
    label: "synthetic demo datasets",
    note: "UI fixtures only. They are not audited human cohorts.",
    tone: "primary" as const,
  },
  {
    value: "—",
    label: "audited human cells",
    note: "Withheld until the scRNA audit completes. No 100M+ claim.",
    tone: "warm" as const,
  },
];

const RELEASE_STATE = [
  { label: "Human scRNA audit", value: "In progress", tone: "warm" as const },
  { label: "Full-S3 checkpoint", value: "Not loaded", tone: "neutral" as const },
  { label: "Production predictions", value: "Unavailable", tone: "neutral" as const },
  { label: "Download products", value: "Disabled", tone: "neutral" as const },
];

export default function HomePage() {
  return (
    <>
      <CinematicHero />

      <section className="bg-[#F1F5FC]">
        <div className="shell py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <p className="eyebrow">The resource</p>
              <h2 className="mt-3 max-w-2xl font-serif text-[34px] leading-[1.08] text-[#0B2A6F] sm:text-[46px]">
                A prediction-first atlas for single-cell methylation.
              </h2>
              <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                Full-S3 CPGMoE infers panel-based DNA methylation from observed
                RNA expression. This portal keeps the prediction, the evidence,
                and the audit trail separate, so a value is never mistaken for a
                measurement.
              </p>

              <GlobalSearch />

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-faint">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-warm" aria-hidden="true" />
                  Synthetic demo only
                </span>
                <span>GRCh38 / hg38</span>
                <span>Research-use prediction</span>
              </div>
            </div>

            <div className="lg:pt-8">
              <div className="flex items-end justify-between border-b border-[#C9D8F5] pb-3">
                <p className="micro-label">What is inside</p>
                <span className="text-[10px] text-ink-faint">04 tools</span>
              </div>
              <div className="divide-y divide-[#D8E3F3]">
                {ENTRIES.map((entry, index) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="group flex items-start gap-4 py-4"
                  >
                    <span className="mt-0.5 w-6 shrink-0 font-mono text-[10px] text-[#7C8CA1]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ink transition-colors group-hover:text-primary">
                        {entry.title}
                      </span>
                      <span className="mt-1 block max-w-sm text-[12px] leading-relaxed text-ink-faint">
                        {entry.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D8E3F3] bg-white">
        <div className="shell">
          <div className="flex flex-col gap-2 border-b border-[#E3EBF7] py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="micro-label">Resource scope</p>
            <p className="text-[10px] text-ink-faint">
              Counts are withheld until the audit completes
            </p>
          </div>
          <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-[#E3EBF7]">
            {METRICS.map((metric) => (
              <div key={metric.label} className="px-0 py-7 sm:px-7 sm:first:pl-0">
                <p
                  className={`font-serif text-[48px] leading-none ${
                    metric.tone === "warm" ? "text-warm" : "text-[#156E86]"
                  }`}
                >
                  {metric.value}
                </p>
                <p className="mt-2 text-[13px] font-medium text-ink">
                  {metric.label}
                </p>
                <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-ink-faint">
                  {metric.note}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E3EBF7] py-5">
            <div className="panel-inset grid gap-5 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <DemoValue label="Indexed cells" compact />
              <DemoValue label="Eligible cells" compact />
              <DemoValue label="Encoded cells" compact />
              <DemoValue label="Predicted cells" compact />
            </div>
            <p className="mt-2 text-[10px] text-ink-faint">
              A dash means “not established”, not zero. File-level records are
              not independent cells.
            </p>
          </div>
        </div>
      </section>

      <section className="shell py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Catalogue</p>
            <h2 className="mt-2 font-serif text-[32px] leading-tight text-[#0B2A6F] sm:text-[40px]">
              Featured datasets
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
              A preview of the synthetic catalogue. Every ID begins with{" "}
              <span className="mono">DEMO_</span>; every cell count is an
              illustrative placeholder.
            </p>
          </div>
          <Link className="btn btn-secondary shrink-0" href="/datasets">
            All 12 datasets
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 border-y border-line">
          <div className="hidden grid-cols-[1.7fr_1fr_0.6fr_auto] gap-4 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
            <span>Dataset</span>
            <span>Tissue / disease</span>
            <span>Cells</span>
            <span className="text-right">Stage</span>
          </div>
          {DEMO_DATASETS.slice(0, 4).map((dataset) => (
            <Link
              key={dataset.dataset_id}
              href={`/datasets/${dataset.dataset_id}`}
              className="group grid gap-2 border-t border-line px-2 py-4 transition-colors hover:bg-[#F7FAFE] sm:grid-cols-[1.7fr_1fr_0.6fr_auto] sm:items-center sm:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-ink group-hover:text-primary">
                  {dataset.title}
                </p>
                <p className="mono mt-0.5 text-[10px] text-ink-faint">
                  {dataset.dataset_id}
                </p>
              </div>
              <div className="text-[12px] text-ink-soft">
                <span>{dataset.tissue}</span>
                <span className="text-ink-faint"> · {dataset.disease}</span>
              </div>
              <div className="tabular text-[12px] text-ink-soft">
                ≈{dataset.n_cells?.toLocaleString("en-US")}
                <span className="text-ink-faint">*</span>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <StatusBadge status={dataset.status} />
                <ArrowRight
                  className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-ink-faint">
          * Illustrative placeholder. Not an audited or predicted cell count.
        </p>
      </section>

      <section className="border-y border-[#D8E3F3] bg-[#F7FAFE]">
        <div className="shell py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Inside the portal</p>
              <h2 className="mt-2 font-serif text-[32px] leading-tight text-[#0B2A6F] sm:text-[40px]">
                A working interface, not a mockup.
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
                These previews open into the real synthetic controls: filters,
                cell selection, CpG lookup, and group comparison.
              </p>
            </div>
            <Link className="btn btn-secondary shrink-0" href="/atlas">
              Open Cell Atlas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6">
            <VisualTeaser />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="shell py-14">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <p className="eyebrow">Model & evidence</p>
              <h2 className="mt-2 font-serif text-[32px] leading-tight text-[#0B2A6F] sm:text-[40px]">
                Prediction, not measurement.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
                Full-S3 CPGMoE is trained on bulk multi-omics data and predicts
                methylation for a specified Illumina 450K panel CpG space. The
                single-cell layer is an inference target, not an experimentally
                measured methylation profile.
              </p>
              <div className="mt-5 flex items-start gap-2 border border-warm/25 bg-warm-wash px-3 py-2 text-[12px] text-warm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{MODEL_EVIDENCE_NOTE}</span>
              </div>
              <Link
                href="/methods"
                className="link-quiet mt-5 inline-flex items-center gap-1 text-[12px]"
              >
                Read the methods and evaluation boundaries
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <div className="flex items-end justify-between border-b border-line pb-3">
                <p className="micro-label">Release state</p>
                <Badge tone="warm" dot>
                  Phase 0
                </Badge>
              </div>
              <div className="divide-y divide-line">
                {RELEASE_STATE.map((item, index) => (
                  <div key={item.label} className="flex items-center gap-3 py-3">
                    <span className="w-5 font-mono text-[10px] text-ink-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[12px] text-ink-soft">
                      {item.label}
                    </span>
                    <Badge tone={item.tone} dot>
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-px border border-line bg-line text-[11px]">
                {[
                  ["Model family", "Full-S3 CPGMoE"],
                  ["Training domain", "TCGA bulk multi-omics"],
                  ["Target space", "450K panel CpGs"],
                  ["Checkpoint", "Not loaded"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white px-3 py-2.5">
                    <dt className="text-[10px] uppercase text-ink-faint">{label}</dt>
                    <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050A2E] text-center text-white">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative shell py-16">
          <p className="text-[10px] uppercase text-[#8FA9FF]">Phase 0 atlas</p>
          <h2 className="mt-3 font-serif text-[38px] leading-tight text-[#F2F6FF] sm:text-[48px]">
            Enter the atlas.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-[#B9C8F5]">
            Explore the working demo, or read the evidence boundaries first.
            Nothing here is a production prediction or a measured scDNAm value.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/atlas"
              className="inline-flex h-11 items-center gap-2 bg-[#5BC8BE] px-5 text-[13px] font-semibold text-[#031318] transition-colors hover:bg-[#7ADBD1]"
              style={{ borderRadius: 3 }}
            >
              Open Cell Atlas
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/datasets"
              className="inline-flex h-11 items-center gap-2 border border-white/20 px-5 text-[13px] font-medium text-[#DCE7FF] transition-colors hover:bg-white/[0.06]"
              style={{ borderRadius: 3 }}
            >
              Browse datasets
            </Link>
          </div>
          <p className="mt-6 text-[10px] text-[#5F7085]">
            Synthetic visualization · research preview · no experimental data
          </p>
        </div>
      </section>
    </>
  );
}
