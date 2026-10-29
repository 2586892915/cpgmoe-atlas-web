"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { CpgPanel } from "@/components/pilot/cpg-panel";
import type { PilotGroup } from "@/lib/pilot";

export type SearchCpg = {
  cpg_id: string;
  chr: string | null;
  pos: number | null;
  genes: string | null;
  profiled: boolean;
  panel_slot: number | null;
  global_mean_beta: number;
  total_variance: number;
  celltype_variance_fraction: number;
  island_relation: string | null;
  promoter: string | null;
};

export type SearchPayload = {
  query: string;
  query_type: "gene" | "probe" | "region" | "group" | "unknown" | "empty";
  cpgs: SearchCpg[];
  groups: PilotGroup[];
  gene: { symbol: string; cpg_count: number } | null;
  region: { chr: string; start: number; end: number } | null;
  truncated: boolean;
  total?: number;
  coverage?: { indexed_probes: number; profiled_cpgs: number };
};

const EXAMPLES = [
  { label: "TP53", value: "TP53" },
  { label: "PTPRN2", value: "PTPRN2" },
  { label: "cg00050873", value: "cg00050873" },
  { label: "chrX:90,689,602-90,690,119", value: "chrX:90689602-90690119" },
];

const TYPE_LABEL: Record<SearchPayload["query_type"], string> = {
  gene: "gene",
  probe: "probe",
  region: "region",
  group: "group",
  unknown: "no match",
  empty: "empty",
};

function locus(cpg: SearchCpg) {
  if (!cpg.chr || cpg.pos === null) return "locus unavailable";
  return `${cpg.chr}:${cpg.pos.toLocaleString("en-US")}`;
}

export function PilotBrowser({
  initialQuery,
  initialResults,
  suggestedCpg,
}: {
  initialQuery: string;
  initialResults: SearchPayload;
  suggestedCpg: string | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchPayload>(initialResults);
  const [selected, setSelected] = useState<string | null>(suggestedCpg);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function syncUrl(nextQuery: string, cpgId: string | null) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (cpgId) params.set("cpg", cpgId);
    const text = params.toString();
    window.history.replaceState(null, "", text ? `/browser?${text}` : "/browser");
  }

  function selectCpg(cpgId: string) {
    setSelected(cpgId);
    syncUrl(query, cpgId);
  }

  async function runSearch(next: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/pilot/search?q=${encodeURIComponent(next)}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Search failed");
      }
      setResults(payload as SearchPayload);
      if (payload.cpgs?.length > 0) {
        setSelected(payload.cpgs[0].cpg_id);
        syncUrl(next, payload.cpgs[0].cpg_id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch(query.trim());
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Gene symbol, CpG probe, or chr:start-end"
              className="h-11 w-full border border-line bg-white pl-9 pr-3 text-[13px] text-ink outline-none focus:border-primary"
              aria-label="Search the pilot panel"
            />
          </div>
          <button
            type="submit"
            className="h-11 bg-primary px-5 text-[12px] font-semibold text-white transition-colors hover:bg-primary-dark"
            style={{ borderRadius: 3 }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ink-faint">
          <span>Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.value}
              type="button"
              onClick={() => {
                setQuery(example.label);
                void runSearch(example.value);
              }}
              className="mono border border-line px-1.5 py-0.5 text-ink-soft transition-colors hover:border-primary/50 hover:text-primary"
            >
              {example.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 border border-warm/30 bg-warm-wash px-3 py-2 text-[12px] text-warm">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-b border-line pb-2">
          <p className="micro-label">
            {results.query_type === "empty"
              ? "Search the panel"
              : `${TYPE_LABEL[results.query_type]} · ${(
                  results.total ?? results.cpgs.length
                ).toLocaleString("en-US")} probe${
                  (results.total ?? results.cpgs.length) === 1 ? "" : "s"
                }`}
          </p>
          <span className="text-[10px] text-ink-faint">
            {results.coverage
              ? `${results.coverage.indexed_probes.toLocaleString("en-US")} probes · full-panel β`
              : "485,403 probes"}
          </span>
        </div>

        {results.cpgs.length > 0 ? (
          <div className="divide-y divide-line">
            {results.cpgs.map((cpg) => (
              <button
                key={cpg.cpg_id}
                type="button"
                onClick={() => selectCpg(cpg.cpg_id)}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-paper-tint ${
                  selected === cpg.cpg_id ? "bg-paper-tint" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {cpg.genes?.split(";")[0] ?? "Unannotated CpG"}
                  </span>
                  <span className="mono mt-0.5 block truncate text-[10px] text-ink-faint">
                    {cpg.cpg_id} · {locus(cpg)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`border px-1.5 py-0.5 text-[9px] ${
                      cpg.profiled
                        ? "border-primary/30 text-primary"
                        : "border-line text-ink-faint"
                    }`}
                  >
                    {cpg.profiled ? "panel + full" : "full β"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-line bg-paper-tint px-4 py-6">
            <p className="text-[13px] font-medium text-ink">
              {results.query_type === "empty"
                ? "Enter a gene, probe, or GRCh38 interval."
                : "No probe in the pilot panel matches this query."}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
              Only gene symbols and hg38 coordinates are indexed; try a gene,
              probe, or region.
            </p>
          </div>
        )}

        {results.truncated ? (
          <p className="mt-2 text-[10px] text-ink-faint">
            Showing the first results only; refine the query to narrow it down.
          </p>
        ) : null}

        {results.groups.length > 0 ? (
          <div className="mt-6">
            <p className="micro-label border-b border-line pb-2">
              Matching tissue / cell-type groups
            </p>
            <div className="divide-y divide-line">
              {results.groups.map((group) => (
                <Link
                  key={group.group_id}
                  href={`/groups/${group.group_id}`}
                  className="group flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-ink group-hover:text-primary">
                      {group.cell_type}
                    </span>
                    <span className="text-[10px] text-ink-faint">
                      {group.tissue} · {group.n_cells.toLocaleString("en-US")} cells
                    </span>
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-ink-faint"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-20">
        <CpgPanel cpgId={selected} />
      </div>
    </div>
  );
}
