import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { CinematicHero } from "@/components/home/cinematic-hero";
import { VisualTeaser } from "@/components/home/visual-teaser";
import { GlobalSearch } from "@/components/global-search";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MODEL_EVIDENCE_NOTE } from "@/lib/data-mode";
import { DEMO_DATASETS } from "@/mock/datasets";

const ENTRIES = [
  { href: "/atlas", title: "Cell Atlas" },
  { href: "/browser", title: "Gene & CpG Browser" },
  { href: "/compare", title: "Compare Groups" },
  { href: "/downloads", title: "Downloads & API" },
];

const METRICS = [
  { value: "450K", label: "panel CpGs" },
  { value: "12", label: "demo datasets" },
  { value: "—", label: "audited cells", tone: "warm" as const },
];

const MODEL_FACTS = [
  ["Model", "CPGMoE"],
  ["Training", "TCGA bulk multi-omics"],
  ["Target", "450K panel CpGs"],
  ["Checkpoint", "Not loaded"],
];

export default function HomePage() {
  return (
    <>
      <CinematicHero />

      <section className="bg-[#F1F5FC]">
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <h2 className="max-w-2xl font-serif text-[34px] leading-[1.08] text-[#0B2A6F] sm:text-[46px]">
                A prediction-first atlas for single-cell methylation.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                CPGMoE infers panel-based DNA methylation from RNA expression.
              </p>
              <GlobalSearch />
            </div>

            <div>
              <p className="micro-label border-b border-[#C9D8F5] pb-3">Tools</p>
              <div className="divide-y divide-[#D8E3F3]">
                {ENTRIES.map((entry) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="group flex items-center justify-between gap-4 py-4"
                  >
                    <span className="text-[15px] font-medium text-ink transition-colors group-hover:text-primary">
                      {entry.title}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
        <div className="shell grid sm:grid-cols-3 sm:divide-x sm:divide-[#E3EBF7]">
          {METRICS.map((metric) => (
            <div key={metric.label} className="py-7 sm:px-7 sm:first:pl-0">
              <p
                className={`font-serif text-[46px] leading-none ${
                  metric.tone === "warm" ? "text-warm" : "text-[#156E86]"
                }`}
              >
                {metric.value}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-[30px] leading-tight text-[#0B2A6F] sm:text-[38px]">
            Featured datasets
          </h2>
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
          * Illustrative counts, not audited data.
        </p>
      </section>

      <section className="border-y border-[#D8E3F3] bg-[#F7FAFE]">
        <div className="shell py-12">
          <VisualTeaser />
        </div>
      </section>

      <section className="bg-white">
        <div className="shell py-14">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <h2 className="font-serif text-[30px] leading-tight text-[#0B2A6F] sm:text-[38px]">
                Prediction, not measurement.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
                CPGMoE predicts methylation over a defined 450K panel CpG
                space. Single-cell use is an inference target, not a measured
                profile.
              </p>
              <div className="mt-5 flex items-start gap-2 border border-warm/25 bg-warm-wash px-3 py-2 text-[12px] text-warm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{MODEL_EVIDENCE_NOTE}</span>
              </div>
              <Link
                href="/methods"
                className="link-quiet mt-5 inline-flex items-center gap-1 text-[12px]"
              >
                Read methods
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <div className="flex items-end justify-between border-b border-line pb-3">
                <p className="micro-label">Phase 0</p>
                <Badge tone="warm" dot>
                  Audit in progress
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-px border border-line bg-line text-[11px]">
                {MODEL_FACTS.map(([label, value]) => (
                  <div key={label} className="bg-white px-3 py-2.5">
                    <dt className="text-[10px] uppercase text-ink-faint">
                      {label}
                    </dt>
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
          <h2 className="font-serif text-[38px] leading-tight text-[#F2F6FF] sm:text-[48px]">
            Enter the atlas.
          </h2>
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
        </div>
      </section>
    </>
  );
}
