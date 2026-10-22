"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Dna,
  Info,
  Loader2,
  Search,
} from "lucide-react";
import { ChartFrame, useVizState } from "@/components/chart-frame";
import { GeneOverview } from "@/components/browser/gene-overview";
import { GenomeTrack } from "@/components/browser/genome-track";
import { CpgDistribution } from "@/components/browser/cpg-distribution";
import { Badge } from "@/components/ui/badge";
import {
  formatBp,
  parseSearchQuery,
  toDisplayRange,
} from "@/lib/coordinate-utils";
import type {
  CellRecord,
  CpgSearchResponse,
} from "@/lib/schemas";
import { groupSummaryByCellType } from "@/mock/methylation";

const EXAMPLES = [
  "TP53",
  "CDKN2A",
  "cg00000029",
  "chr17:7,668,001-7,690,000",
];

type Status = "idle" | "loading" | "success" | "error";

export function BrowserExplorer({
  initialQuery,
  cells,
}: {
  initialQuery: string;
  cells: CellRecord[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<CpgSearchResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedCpgId, setSelectedCpgId] = useState<string | null>(null);
  const geneState = useVizState("demo");
  const distributionState = useVizState("demo");
  const trackState = useVizState("demo");
  const lastAutoQuery = useRef<string | null>(null);

  const runQuery = async (raw: string) => {
    const nextQuery = raw.trim();
    setQuery(raw);
    if (!nextQuery) {
      setResult(null);
      setStatus("idle");
      setError(null);
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/cpgs?query=${encodeURIComponent(nextQuery)}&assembly=GRCh38`,
      );
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(
                (payload as { error: { message?: string } }).error?.message ??
                  "Search failed",
              )
            : "Search failed";
        throw new Error(message);
      }
      const payload = (await response.json()) as CpgSearchResponse;
      setResult(payload);
      setSelectedCpgId(payload.items[0]?.cpg_id ?? null);
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Search failed");
    }
  };

  useEffect(() => {
    if (initialQuery && lastAutoQuery.current !== initialQuery) {
      lastAutoQuery.current = initialQuery;
      void runQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const selectedCpg = useMemo(
    () => result?.items.find((item) => item.cpg_id === selectedCpgId) ?? null,
    [result, selectedCpgId],
  );

  const parsedResult = useMemo(
    () => (result ? parseSearchQuery(result.query) : null),
    [result],
  );

  const window = useMemo(() => {
    if (parsedResult?.kind === "region") {
      return {
        chrom: parsedResult.region.chrom,
        start: parsedResult.region.internal.start,
        end: parsedResult.region.internal.end,
      };
    }
    if (result?.gene) {
      return { chrom: result.gene.chrom, start: result.gene.start, end: result.gene.end };
    }
    if (selectedCpg?.chrom && selectedCpg.start !== null && selectedCpg.end !== null) {
      return {
        chrom: selectedCpg.chrom,
        start: Math.max(0, selectedCpg.start - 4000),
        end: selectedCpg.end + 4000,
      };
    }
    return null;
  }, [parsedResult, result?.gene, selectedCpg]);

  const annotationWithheld = Boolean(
    selectedCpg && selectedCpg.annotation_status === "annotation_withheld",
  );

  const groups = useMemo(
    () => (selectedCpgId ? groupSummaryByCellType(cells, selectedCpgId) : []),
    [cells, selectedCpgId],
  );

  const queryTypeLabel =
    parsedResult?.kind === "gene"
      ? "Gene"
      : parsedResult?.kind === "probe"
        ? "Probe"
        : parsedResult?.kind === "region"
          ? "Region"
          : "Query";

  return (
    <div>
      <form
        className="panel p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runQuery(query);
        }}
        role="search"
        aria-label="Search genes, CpG probes, or regions"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="browser-query" className="sr-only">
              Gene, CpG probe, or GRCh38 region
            </label>
            <input
              id="browser-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="TP53 · cg00000029 · chr17:7,668,001-7,690,000"
              className="field pl-9"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {status === "loading" ? "Searching" : "Search"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-faint">
          <span>Examples</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="mono text-primary underline decoration-primary/25 underline-offset-2 hover:decoration-primary"
              onClick={() => void runQuery(example)}
            >
              {example}
            </button>
          ))}
          <span className="ml-auto inline-flex items-center gap-1">
            <Info className="h-3 w-3" aria-hidden="true" />
            GRCh38/hg38 · internal 0-based half-open · UI 1-based inclusive
          </span>
        </div>
      </form>

      {status === "idle" ? (
        <section className="panel mt-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/20 bg-primary-wash text-primary">
              <Dna className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-ink">
                Query a gene, probe, or interval
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
                This demo maps a small predefined panel. It does not contain a
                genome-wide probe index, and it never invents a real hg38
                coordinate for a probe whose annotation is withheld.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Gene symbol", "TP53, CDKN2A, EGFR", "Resolves to demo panel CpGs and an illustrative gene model."],
              ["Probe ID", "cg00000029", "Accepted as a format; genomic annotation may be withheld."],
              ["GRCh38 region", "chr17:7,668,001-7,690,000", "Returns demo panel CpGs inside the 1-based inclusive interval."],
            ].map(([title, example, description]) => (
              <div key={title} className="border border-line bg-paper-tint px-3 py-2.5">
                <p className="text-[12px] font-semibold text-ink">{title}</p>
                <p className="mono mt-1 text-[11px] text-primary">{example}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {status === "loading" ? (
        <section className="panel mt-4 p-6" role="status" aria-live="polite">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton mt-3 h-3 w-full max-w-xl" />
          <div className="skeleton mt-2 h-3 w-full max-w-lg" />
          <div className="skeleton mt-5 h-28 w-full" />
        </section>
      ) : null}

      {status === "error" ? (
        <section className="panel mt-4 p-6" role="alert">
          <div className="flex items-start gap-2 text-warm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Search failed</p>
              <p className="mt-1 text-[12px] text-ink-soft">{error}</p>
              <button
                type="button"
                className="btn btn-secondary mt-3 h-8"
                onClick={() => void runQuery(query)}
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {status === "success" && result ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-y border-line py-2.5">
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <h2 className="text-[15px] font-semibold text-ink">Search results</h2>
              <Badge tone="neutral">{queryTypeLabel}</Badge>
              <span className="mono text-[11px] text-ink-faint">{result.query}</span>
              <span className="text-[11px] text-ink-faint">
                {result.items.length} demo CpG{result.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <Badge tone="primary" dot>
              Synthetic demo
            </Badge>
          </div>

          {result.items.length === 0 ? (
            <section className="panel mt-4 p-6">
              <div className="flex items-start gap-3">
                <Search className="mt-0.5 h-5 w-5 text-ink-faint" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-ink">No demo records found</p>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-soft">
                    {result.empty_reason}
                  </p>
                  <p className="mt-2 text-[11px] text-ink-faint">
                    The empty state is intentional. Unknown queries never fall
                    back to a fabricated record.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <ChartFrame
                  title="Gene overview"
                  eyebrow="Locus"
                  description="Illustrative gene model built for this demo. It is not a curated transcript annotation."
                  state={geneState.state}
                  onStateChange={geneState.setState}
                  bodyClassName="min-h-[170px]"
                  legend={
                    <p className="text-[10px] text-ink-faint">
                      Exon boxes are schematic. Coordinates follow the
                      portal-wide 1-based inclusive display convention.
                    </p>
                  }
                >
                  {result.gene ? (
                    <GeneOverview gene={result.gene} />
                  ) : (
                    <div className="flex min-h-[170px] flex-col items-center justify-center gap-1 px-6 text-center">
                      <p className="text-[12px] font-medium text-ink">
                        No gene model for this query
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        Probe and region queries return panel records without a
                        gene-body model.
                      </p>
                    </div>
                  )}
                </ChartFrame>

                <ChartFrame
                  title="Genome track"
                  eyebrow="GRCh38 / hg38"
                  description="Pluggable genome-browser slot. Only illustrative ruler, panel ticks, and demo gene boxes are drawn."
                  state={trackState.state}
                  onStateChange={trackState.setState}
                  bodyClassName="min-h-[170px]"
                  footer="JBrowse 2 adapter slot reserved. No experimental tracks are mounted in Phase 0."
                >
                  <GenomeTrack
                    chrom={window?.chrom ?? null}
                    start={window?.start ?? null}
                    end={window?.end ?? null}
                    items={result.items}
                    gene={result.gene}
                    annotationWithheld={annotationWithheld}
                  />
                </ChartFrame>
              </div>

              <section className="panel overflow-hidden" aria-labelledby="cpg-table-heading">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <div>
                    <h2 id="cpg-table-heading" className="text-[14px] font-semibold text-ink">
                      CpG / region records
                    </h2>
                    <p className="text-[11px] text-ink-faint">
                      Select a row to drive the group distribution below.
                    </p>
                  </div>
                  <Badge tone="primary" dot>
                    Panel demo
                  </Badge>
                </header>
                <div className="overflow-x-auto">
                  <table className="data-table min-w-[880px]">
                    <caption className="sr-only">
                      Demo CpG panel records for the current query
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="w-10">
                          <span className="sr-only">Inspect</span>
                        </th>
                        <th scope="col">CpG</th>
                        <th scope="col">Panel slot</th>
                        <th scope="col">Gene</th>
                        <th scope="col">hg38 position (1-based inclusive)</th>
                        <th scope="col">Annotation</th>
                        <th scope="col" className="text-right">Synthetic β</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((cpg) => {
                        const display =
                          cpg.start !== null && cpg.end !== null
                            ? toDisplayRange({ start: cpg.start, end: cpg.end })
                            : null;
                        return (
                          <tr
                            key={cpg.cpg_id}
                            className={selectedCpgId === cpg.cpg_id ? "bg-primary-wash" : ""}
                          >
                            <td>
                              <input
                                type="radio"
                                name="cpg-selection"
                                aria-label={`Inspect ${cpg.cpg_id}`}
                                checked={selectedCpgId === cpg.cpg_id}
                                onChange={() => setSelectedCpgId(cpg.cpg_id)}
                                className="h-3.5 w-3.5 accent-[#156E86]"
                              />
                            </td>
                            <td className="mono text-[11px] font-medium text-ink">
                              {cpg.cpg_id}
                            </td>
                            <td className="mono text-[10px]">{cpg.panel_slot}</td>
                            <td>{cpg.gene_symbol ?? "—"}</td>
                            <td className="mono text-[10px]">
                              {display
                                ? `${cpg.chrom}:${formatBp(display.start)}-${formatBp(display.end)}`
                                : "annotation withheld"}
                            </td>
                            <td>
                              {cpg.annotation_status === "synthetic_window" ? (
                                <Badge tone="neutral">Synthetic window</Badge>
                              ) : (
                                <Badge tone="warm">Withheld</Badge>
                              )}
                            </td>
                            <td className="tabular text-right text-[11px]">
                              {cpg.synthetic_beta.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-line px-4 py-2 text-[10px] leading-relaxed text-ink-faint">
                  Synthetic windows are demo annotations, not curated probe
                  coordinates. When annotation is withheld, the portal shows no
                  coordinate rather than inventing one.
                </p>
              </section>

              <ChartFrame
                title="Group-wise methylation distribution"
                eyebrow="Predicted β"
                description={
                  selectedCpg
                    ? `${selectedCpg.cpg_id} · ${selectedCpg.gene_symbol ?? "unnamed demo panel CpG"} · synthetic cell-level values`
                    : "Select a CpG record to populate this view."
                }
                state={distributionState.state}
                onStateChange={distributionState.setState}
                bodyClassName="min-h-[280px]"
                legend={
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-ink-faint">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rna/60" aria-hidden="true" />
                      Individual synthetic cells (sampled)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-[2px] bg-primary" aria-hidden="true" />
                      Group mean
                    </span>
                    <span>No p-values or DMR calls</span>
                  </div>
                }
              >
                {selectedCpgId ? (
                  <CpgDistribution groups={groups} cells={cells} cpgId={selectedCpgId} />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center text-[12px] text-ink-faint">
                    Select a CpG record above.
                  </div>
                )}
              </ChartFrame>
            </div>
          )}
        </>
      ) : null}

      <div className="mt-4 border border-line bg-paper-tint px-4 py-3 text-[11px] leading-relaxed text-ink-faint">
        <p className="font-medium text-ink-soft">Coordinate contract</p>
        <p className="mt-1">
          Internal storage is 0-based half-open; every UI label is 1-based
          inclusive. Conversions are centralised in{" "}
          <span className="mono">lib/coordinate-utils.ts</span>. Genome build is
          fixed to GRCh38/hg38 for Phase 0.
        </p>
      </div>
    </div>
  );
}
