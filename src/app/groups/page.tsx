import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { listGroups, pilotRelease } from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Cell types",
  description:
    "Tissue and cell-type groups profiled by the CPGMoE 3M-cell Full-S3 pilot.",
};

const PAGE_SIZE = 50;

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; organ_system?: string; hc?: string; offset?: string }>;
}) {
  if (!IS_PILOT) {
    return (
      <div className="shell py-10">
        <h1 className="text-[26px] font-semibold text-ink">Groups</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Group-level aggregates are only available in the pilot release.
        </p>
      </div>
    );
  }

  const { q, organ_system: organ, hc, offset } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const highConfidence = hc === "1";
  const start = Math.max(0, Number(offset ?? "0") || 0);

  const all = listGroups().sort((a, b) => b.n_cells - a.n_cells);
  const filtered = all.filter((group) => {
    if (highConfidence && !group.high_confidence) return false;
    if (organ && group.organ_system !== organ) return false;
    if (
      query &&
      !`${group.cell_type} ${group.tissue} ${group.organ_system}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });
  const page = filtered.slice(start, start + PAGE_SIZE);
  const organs = Array.from(
    all.reduce((map, group) => {
      map.set(group.organ_system, (map.get(group.organ_system) ?? 0) + group.n_cells);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const buildQuery = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, organ_system: organ, hc, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const text = params.toString();
    return text ? `/groups?${text}` : "/groups";
  };

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Cell types &amp; tissues
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            {pilotRelease.n_groups.toLocaleString("en-US")} groups with cell,
            donor and study support.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone="warm" dot>
            Pilot release
          </Badge>
          <Badge tone="neutral">
            {pilotRelease.n_groups_high_confidence} high-confidence
          </Badge>
        </div>
      </div>

      <form action="/groups" className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search cell type, tissue, or organ"
            className="h-10 w-full border border-line bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        {organ ? <input type="hidden" name="organ_system" value={organ} /> : null}
        {highConfidence ? <input type="hidden" name="hc" value="1" /> : null}
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
          href={buildQuery({ organ_system: undefined, offset: undefined })}
          className={`border px-2 py-0.5 ${
            organ ? "border-line text-ink-soft" : "border-primary bg-primary text-white"
          }`}
        >
          All organs
        </Link>
        {organs.map(([name, cells]) => (
          <Link
            key={name}
            href={buildQuery({ organ_system: name, offset: undefined })}
            className={`border px-2 py-0.5 ${
              organ === name
                ? "border-primary bg-primary text-white"
                : "border-line text-ink-soft hover:border-primary/40"
            }`}
            title={`${cells.toLocaleString("en-US")} cells`}
          >
            {name}
          </Link>
        ))}
        <Link
          href={buildQuery({
            hc: highConfidence ? undefined : "1",
            offset: undefined,
          })}
          className={`ml-1 border px-2 py-0.5 ${
            highConfidence
              ? "border-warm bg-warm text-white"
              : "border-line text-ink-soft hover:border-warm/50"
          }`}
        >
          High-confidence only
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-ink-faint">
        <span>
          {filtered.length.toLocaleString("en-US")} groups
          {organ ? ` in ${organ}` : ""}
        </span>
        <span>
          showing {Math.min(start + 1, filtered.length)}–
          {Math.min(start + PAGE_SIZE, filtered.length)}
        </span>
      </div>

      <div className="mt-2 border-y border-line">
        <div className="hidden grid-cols-[1.6fr_1.1fr_0.6fr_0.5fr_0.5fr_auto] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint md:grid">
          <span>Cell type</span>
          <span>Tissue</span>
          <span>Organ</span>
          <span className="text-right">Cells</span>
          <span className="text-right">Donors</span>
          <span className="text-right">Support</span>
        </div>
        {page.map((group) => (
          <Link
            key={group.group_id}
            href={`/groups/${group.group_id}`}
            className="group grid gap-2 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint md:grid-cols-[1.6fr_1.1fr_0.6fr_0.5fr_0.5fr_auto] md:items-center md:gap-3"
          >
            <span className="truncate text-[12px] font-medium text-ink group-hover:text-primary">
              {group.cell_type}
            </span>
            <span className="truncate text-[11px] text-ink-soft">{group.tissue}</span>
            <span className="truncate text-[10px] text-ink-faint">{group.organ_system}</span>
            <span className="tabular text-[11px] text-ink-soft md:text-right">
              {group.n_cells.toLocaleString("en-US")}
            </span>
            <span className="tabular text-[11px] text-ink-soft md:text-right">
              {group.n_donors}
            </span>
            <span className="flex items-center gap-2 md:justify-end">
              {group.high_confidence ? (
                <Badge tone="primary" dot>
                  HC
                </Badge>
              ) : (
                <span className="text-[10px] text-ink-faint">
                  {group.n_datasets} {group.n_datasets === 1 ? "study" : "studies"}
                </span>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[12px]">
        {start > 0 ? (
          <Link
            href={buildQuery({ offset: String(Math.max(0, start - PAGE_SIZE)) })}
            className="btn btn-secondary"
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {start + PAGE_SIZE < filtered.length ? (
          <Link
            href={buildQuery({ offset: String(start + PAGE_SIZE) })}
            className="btn btn-secondary"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
