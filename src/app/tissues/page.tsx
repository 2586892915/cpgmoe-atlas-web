import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { count, humanize } from "@/lib/format";
import { listTissues, pilotRelease } from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Tissues",
  description: "Tissues profiled by the CPGMoE 3M-cell pilot.",
};

export default async function TissuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; organ?: string }>;
}) {
  if (!IS_PILOT) {
    return (
      <div className="shell py-10">
        <h1 className="text-[26px] font-semibold text-ink">Tissues</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Tissue coverage is only available in the pilot release.
        </p>
      </div>
    );
  }

  const { q, organ } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const all = listTissues();
  const filtered = all.filter((tissue) => {
    if (organ && tissue.organ_system !== organ) return false;
    if (query && !tissue.tissue.toLowerCase().includes(query)) return false;
    return true;
  });
  const organs = Array.from(
    all.reduce((map, tissue) => {
      map.set(tissue.organ_system, (map.get(tissue.organ_system) ?? 0) + tissue.n_cells);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">Tissues</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            {pilotRelease.n_tissues} tissues across {count(pilotRelease.n_groups)} cell-type
            groups.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone="warm" dot>
            Pilot release
          </Badge>
          <Badge tone="neutral">{pilotRelease.n_organ_systems} organ systems</Badge>
        </div>
      </div>

      <form action="/tissues" className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search tissue"
            className="h-10 w-full border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        {organ ? <input type="hidden" name="organ" value={organ} /> : null}
        <button
          type="submit"
          className="h-10 bg-primary px-4 text-[12px] font-semibold text-white hover:bg-primary-dark"
          style={{ borderRadius: 3 }}
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <Link
          href={q ? `/tissues?q=${encodeURIComponent(q)}` : "/tissues"}
          className={`border px-2 py-0.5 ${
            organ ? "border-line text-ink-soft" : "border-primary bg-primary text-white"
          }`}
        >
          All organs
        </Link>
        {organs.map(([name, cells]) => (
          <Link
            key={name}
            href={`/tissues?organ=${encodeURIComponent(name)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`border px-2 py-0.5 ${
              organ === name
                ? "border-primary bg-primary text-white"
                : "border-line text-ink-soft hover:border-primary/40"
            }`}
            title={`${cells.toLocaleString("en-US")} cells`}
          >
            {humanize(name)}
          </Link>
        ))}
      </div>

      <div className="mt-4 border-y border-line">
        <div className="hidden grid-cols-[1.8fr_1.2fr_0.5fr_0.6fr_auto] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
          <span>Tissue</span>
          <span>Organ system</span>
          <span className="text-right">Groups</span>
          <span className="text-right">Cells</span>
          <span />
        </div>
        {filtered.map((tissue) => (
          <Link
            key={tissue.tissue}
            href={`/tissues/${encodeURIComponent(tissue.tissue)}`}
            className="group grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint sm:grid-cols-[1.8fr_1.2fr_0.5fr_0.6fr_auto] sm:items-center sm:gap-3"
          >
            <span className="truncate text-[12px] font-medium text-ink group-hover:text-primary">
              {tissue.tissue}
            </span>
            <span className="text-[10px] text-ink-faint sm:hidden">
              {humanize(tissue.organ_system)} · {tissue.n_groups} groups ·{" "}
              {count(tissue.n_cells)} cells
            </span>
            <span className="hidden truncate text-[11px] text-ink-soft sm:inline">
              {humanize(tissue.organ_system)}
            </span>
            <span className="hidden tabular text-[11px] text-ink-soft sm:inline sm:text-right">
              {tissue.n_groups}
            </span>
            <span className="hidden tabular text-[11px] text-ink-soft sm:inline sm:text-right">
              {count(tissue.n_cells)}
            </span>
            <ArrowRight
              className="hidden h-3.5 w-3.5 text-ink-faint sm:block"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-[12px] text-ink-faint">No tissue matches this filter.</p>
      ) : null}
    </div>
  );
}
