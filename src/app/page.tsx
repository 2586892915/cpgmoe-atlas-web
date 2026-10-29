import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CinematicHero } from "@/components/home/cinematic-hero";
import { GlobalSearch } from "@/components/global-search";
import { count } from "@/lib/format";
import { IS_PILOT } from "@/lib/data-mode";
import { FULL_LEVELS } from "@/lib/full-profiles";
import { pilotHeatmap, pilotRelease } from "@/lib/pilot";

const TOOLS = IS_PILOT
  ? [
      { href: "/atlas", title: "Atlas" },
      { href: "/tissues", title: "Tissues" },
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
      { value: "2,093", label: "tissue × cell-type groups" },
      {
        value: `${FULL_LEVELS.find((level) => level.id === "celltype")?.n_groups ?? 569}`,
        label: "cell types",
      },
      { value: "485K", label: "CpGs" },
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
  return value.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

export default function HomePage() {
  const organs = IS_PILOT ? pilotHeatmap().organ_systems : [];

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
            <Link href="/tissues" className="text-[12px] text-primary hover:underline">
              All tissues →
            </Link>
          </div>

          <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {organs.map((organ) => (
              <Link
                key={organ.label}
                href={`/tissues?organ=${encodeURIComponent(organ.label)}`}
                className="group bg-white px-4 py-4 transition-colors hover:bg-[#F7FAFE]"
              >
                <p className="tabular text-[10px] text-ink-faint">
                  {organ.n_groups} groups · {count(organ.n_cells)} cells
                </p>
                <p className="mt-1 text-[14px] font-medium text-ink group-hover:text-primary">
                  {pretty(organ.label)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {IS_PILOT ? (
        <div className="shell flex flex-wrap items-center justify-between gap-2 border-t border-line py-3 text-[10px] text-ink-faint">
          <span>Release {pilotRelease.release_id}</span>
          <span>
            Updated {pilotRelease.generated_at} ·{" "}
            {pilotRelease.n_panel_probes.toLocaleString("en-US")} CpGs ·{" "}
            {pilotRelease.n_groups.toLocaleString("en-US")} groups
          </span>
          <Link href="/methods#data-status" className="hover:text-primary">
            Release notes
          </Link>
        </div>
      ) : null}

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
              href="/browser"
              className="inline-flex h-11 items-center gap-2 border border-white/20 px-5 text-[13px] font-medium text-[#DCE7FF] transition-colors hover:bg-white/[0.06]"
              style={{ borderRadius: 3 }}
            >
              Search a CpG
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
