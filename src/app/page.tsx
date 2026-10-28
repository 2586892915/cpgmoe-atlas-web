import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CinematicHero } from "@/components/home/cinematic-hero";
import { VisualTeaser } from "@/components/home/visual-teaser";
import { GlobalSearch } from "@/components/global-search";
import { StatusBadge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { listGroups, pilotHeatmap, pilotRelease } from "@/lib/pilot";
import { DEMO_DATASETS } from "@/mock/datasets";

const TOOLS = IS_PILOT
  ? [
      { href: "/atlas", title: "Atlas" },
      { href: "/groups", title: "Cell types" },
      { href: "/browser", title: "Gene & CpG" },
      { href: "/compare", title: "Compare" },
    ]
  : [
      { href: "/atlas", title: "Cell Atlas" },
      { href: "/browser", title: "Gene & CpG Browser" },
      { href: "/compare", title: "Compare Groups" },
      { href: "/downloads", title: "Downloads & API" },
    ];

const METRICS = IS_PILOT
  ? [
      { value: "3.0M", label: "cells" },
      { value: "2,093", label: "cell-type groups" },
      { value: "435", label: "cell types" },
      { value: "512", label: "CpGs" },
    ]
  : [
      { value: "450K", label: "panel CpGs" },
      { value: "12", label: "demo datasets" },
      { value: "—", label: "audited cells", tone: "warm" as const },
    ];

const ORGAN_LABELS: Record<string, string> = {
  musculoskeletal_connective: "Musculoskeletal & connective",
  head_neck_oral: "Head & neck / oral",
  renal_urinary: "Renal & urinary",
  other_or_unmapped: "Other / unmapped",
};

function pretty(value: string) {
  if (ORGAN_LABELS[value]) return ORGAN_LABELS[value];
  return value
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export default function HomePage() {
  const largestGroups = IS_PILOT
    ? [...listGroups()].sort((a, b) => b.n_cells - a.n_cells).slice(0, 6)
    : [];
  const organs = IS_PILOT
    ? pilotHeatmap().organ_systems.filter(
        (organ) => organ.label !== "other_or_unmapped",
      )
    : [];

  return (
    <>
      <CinematicHero />

      <section className="bg-[#F1F5FC]">
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <h2 className="max-w-2xl font-serif text-[34px] leading-[1.08] text-[#0B2A6F] sm:text-[46px]">
                {IS_PILOT
                  ? "A single-cell methylation atlas."
                  : "A prediction-first atlas for single-cell methylation."}
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                {IS_PILOT
                  ? "3.0 million cells across 2,093 tissue and cell-type groups, queryable by gene, CpG, or region."
                  : "CPGMoE infers panel-based DNA methylation from RNA expression."}
              </p>
              <GlobalSearch />
            </div>

            <div>
              <p className="micro-label border-b border-[#C9D8F5] pb-3">Tools</p>
              <div className="divide-y divide-[#D8E3F3]">
                {TOOLS.map((entry) => (
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
        <div
          className={`shell grid divide-[#E3EBF7] sm:divide-x ${
            IS_PILOT ? "sm:grid-cols-4" : "sm:grid-cols-3"
          }`}
        >
          {METRICS.map((metric) => (
            <div key={metric.label} className="py-7 sm:px-7 sm:first:pl-0">
              <p
                className={`font-serif text-[42px] leading-none ${
                  "tone" in metric && metric.tone === "warm"
                    ? "text-warm"
                    : "text-[#156E86]"
                }`}
              >
                {metric.value}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {IS_PILOT ? (
        <section className="shell py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-[30px] leading-tight text-[#0B2A6F] sm:text-[38px]">
                Browse by tissue
              </h2>
              <p className="mt-1 text-[13px] text-ink-soft">
                {organs.length} organ systems · {pilotRelease.n_tissues} tissues
              </p>
            </div>
            <Link href="/groups" className="text-[12px] text-primary hover:underline">
              All groups →
            </Link>
          </div>

          <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {organs.map((organ) => (
              <Link
                key={organ.label}
                href={`/groups?organ_system=${encodeURIComponent(organ.label)}`}
                className="group bg-white px-4 py-4 transition-colors hover:bg-[#F7FAFE]"
              >
                <p className="tabular text-[10px] text-ink-faint">
                  {organ.n_groups} groups · {organ.n_cells.toLocaleString("en-US")} cells
                </p>
                <p className="mt-1 text-[14px] font-medium text-ink group-hover:text-primary">
                  {pretty(organ.label)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="shell pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-[30px] leading-tight text-[#0B2A6F] sm:text-[38px]">
            {IS_PILOT ? "Largest cell populations" : "Featured datasets"}
          </h2>
          <Link
            className="btn btn-secondary shrink-0"
            href={IS_PILOT ? "/groups" : "/datasets"}
          >
            {IS_PILOT ? "All 2,093 groups" : "All 12 datasets"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {IS_PILOT ? (
          <div className="mt-6 border-y border-line">
            <div className="hidden grid-cols-[1.6fr_1.2fr_0.6fr_0.5fr_auto] gap-4 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
              <span>Cell type</span>
              <span>Tissue</span>
              <span>Cells</span>
              <span>Donors</span>
              <span className="text-right">Studies</span>
            </div>
            {largestGroups.map((group) => (
              <Link
                key={group.group_id}
                href={`/groups/${group.group_id}`}
                className="group grid gap-2 border-t border-line px-2 py-4 transition-colors hover:bg-[#F7FAFE] sm:grid-cols-[1.6fr_1.2fr_0.6fr_0.5fr_auto] sm:items-center sm:gap-4"
              >
                <p className="truncate text-[14px] font-medium text-ink group-hover:text-primary">
                  {group.cell_type}
                </p>
                <p className="truncate text-[12px] text-ink-soft">{group.tissue}</p>
                <p className="tabular text-[12px] text-ink-soft">
                  {group.n_cells.toLocaleString("en-US")}
                </p>
                <p className="tabular text-[12px] text-ink-soft">{group.n_donors}</p>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="tabular text-[11px] text-ink-faint">
                    {group.n_datasets}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <>
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
          </>
        )}
      </section>

      <section className="border-y border-[#D8E3F3] bg-[#F7FAFE]">
        <div className="shell py-12">
          <VisualTeaser />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050A2E] text-center text-white">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative shell py-16">
          <h2 className="font-serif text-[38px] leading-tight text-[#F2F6FF] sm:text-[48px]">
            {IS_PILOT ? "Explore the atlas." : "Enter the atlas."}
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/atlas"
              className="inline-flex h-11 items-center gap-2 bg-[#5BC8BE] px-5 text-[13px] font-semibold text-[#031318] transition-colors hover:bg-[#7ADBD1]"
              style={{ borderRadius: 3 }}
            >
              Open the heatmap
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={IS_PILOT ? "/browser" : "/datasets"}
              className="inline-flex h-11 items-center gap-2 border border-white/20 px-5 text-[13px] font-medium text-[#DCE7FF] transition-colors hover:bg-white/[0.06]"
              style={{ borderRadius: 3 }}
            >
              {IS_PILOT ? "Search a CpG" : "Browse datasets"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
