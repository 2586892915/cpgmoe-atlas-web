"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { ChartFrame, useVizState } from "@/components/chart-frame";
import { DeltaColorBar } from "@/components/color-bar";
import { DeltaHeatmap } from "@/components/compare/delta-heatmap";
import { Badge } from "@/components/ui/badge";
import type {
  CellRecord,
  ComparePreviewResponse,
  CpgRecord,
  DatasetDetail,
} from "@/lib/schemas";
import { groupMeansForCells } from "@/mock/methylation";

type Dimension = "dataset" | "tissue" | "cell_type";

const DIMENSIONS: Array<{ value: Dimension; label: string }> = [
  { value: "dataset", label: "Dataset" },
  { value: "tissue", label: "Tissue" },
  { value: "cell_type", label: "Cell type" },
];

function cellsFor(
  cells: CellRecord[],
  dimension: Dimension,
  value: string,
): CellRecord[] {
  return cells.filter((cell) => {
    if (dimension === "dataset") return cell.dataset_id === value;
    if (dimension === "tissue") return cell.tissue === value;
    return cell.cell_type === value;
  });
}

function GroupSelector({
  label,
  accent,
  dimension,
  value,
  options,
  cells,
  onDimensionChange,
  onValueChange,
}: {
  label: string;
  accent: string;
  dimension: Dimension;
  value: string;
  options: Record<Dimension, Array<{ value: string; label: string }>>;
  cells: CellRecord[];
  onDimensionChange: (dimension: Dimension) => void;
  onValueChange: (value: string) => void;
}) {
  const counts = useMemo(
    () => ({
      cells: cells.length,
      datasets: new Set(cells.map((cell) => cell.dataset_id)).size,
      cellTypes: new Set(cells.map((cell) => cell.cell_type)).size,
    }),
    [cells],
  );

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span
            className="h-2.5 w-2.5"
            style={{ backgroundColor: accent, borderRadius: 2 }}
            aria-hidden="true"
          />
          {label}
        </p>
        <Badge tone="neutral">n = {counts.cells}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label={`${label} grouping dimension`}>
        {DIMENSIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={dimension === option.value}
            onClick={() => onDimensionChange(option.value)}
            className={`border px-2 py-1 text-[11px] ${
              dimension === option.value
                ? "border-primary bg-primary-wash font-medium text-primary"
                : "border-line bg-white text-ink-soft hover:bg-paper-tint"
            }`}
            style={{ borderRadius: 3 }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="micro-label mb-1 block">Group value</span>
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="field h-9 text-[12px]"
        >
          {options[dimension].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-[10px] text-ink-faint">
        {counts.cells} synthetic cells · {counts.datasets} dataset
        {counts.datasets === 1 ? "" : "s"} · {counts.cellTypes} cell type
        {counts.cellTypes === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function CompareExplorer({
  datasets,
  cells,
  cpgOptions,
  initialGroupA,
}: {
  datasets: DatasetDetail[];
  cells: CellRecord[];
  cpgOptions: CpgRecord[];
  initialGroupA?: string;
}) {
  const [dimensionA, setDimensionA] = useState<Dimension>("dataset");
  const [dimensionB, setDimensionB] = useState<Dimension>("dataset");
  const [valueA, setValueA] = useState(
    initialGroupA && datasets.some((dataset) => dataset.dataset_id === initialGroupA)
      ? initialGroupA
      : "DEMO_LUNG_NORMAL_02",
  );
  const [valueB, setValueB] = useState("DEMO_LUNG_ADENO_01");
  const heatmapState = useVizState("demo");
  const [preview, setPreview] = useState<ComparePreviewResponse | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);

  const tissues = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.tissue))).sort(),
    [cells],
  );
  const cellTypes = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.cell_type))).sort(),
    [cells],
  );

  const options = useMemo<Record<Dimension, Array<{ value: string; label: string }>>>(
    () => ({
      dataset: datasets.map((dataset) => ({
        value: dataset.dataset_id,
        label: `${dataset.dataset_id} · ${dataset.tissue}`,
      })),
      tissue: tissues.map((value) => ({ value, label: value })),
      cell_type: cellTypes.map((value) => ({ value, label: value })),
    }),
    [datasets, tissues, cellTypes],
  );

  const chooseDimension = (
    which: "A" | "B",
    nextDimension: Dimension,
  ) => {
    const first = options[nextDimension][0]?.value ?? "";
    if (which === "A") {
      setDimensionA(nextDimension);
      setValueA(first);
    } else {
      setDimensionB(nextDimension);
      setValueB(first);
    }
    setPreview(null);
  };

  const cellsA = useMemo(
    () => cellsFor(cells, dimensionA, valueA),
    [cells, dimensionA, valueA],
  );
  const cellsB = useMemo(
    () => cellsFor(cells, dimensionB, valueB),
    [cells, dimensionB, valueB],
  );

  const cpgIds = cpgOptions.map((cpg) => cpg.cpg_id);
  const meansA = useMemo(() => groupMeansForCells(cellsA, cpgIds), [cellsA, cpgIds]);
  const meansB = useMemo(() => groupMeansForCells(cellsB, cpgIds), [cellsB, cpgIds]);
  const availableCellTypes = useMemo(
    () =>
      Array.from(
        new Set([...cellsA.map((cell) => cell.cell_type), ...cellsB.map((cell) => cell.cell_type)]),
      ).sort(),
    [cellsA, cellsB],
  );

  const swap = () => {
    setDimensionA(dimensionB);
    setDimensionB(dimensionA);
    setValueA(valueB);
    setValueB(valueA);
    setPreview(null);
  };

  const reset = () => {
    setDimensionA("dataset");
    setDimensionB("dataset");
    setValueA("DEMO_LUNG_NORMAL_02");
    setValueB("DEMO_LUNG_ADENO_01");
    setPreview(null);
  };

  const runApiPreview = async () => {
    setPreviewStatus("loading");
    setPreviewError(null);
    try {
      const response = await fetch("/api/v1/preview/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_a: { dimension: dimensionA, value: valueA },
          group_b: { dimension: dimensionB, value: valueB },
          cpg_ids: cpgIds,
        }),
      });
      if (!response.ok) {
        throw new Error("Comparison preview failed");
      }
      const payload = (await response.json()) as ComparePreviewResponse;
      setPreview(payload);
      setPreviewStatus("idle");
    } catch (caught) {
      setPreviewStatus("error");
      setPreviewError(caught instanceof Error ? caught.message : "Comparison preview failed");
    }
  };

  return (
    <div>
      <div className="flex items-start gap-2 border-y border-primary/25 bg-primary-wash px-4 py-3 text-[13px] leading-relaxed text-primary-dark">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Comparisons are based on predicted methylation, not experimentally observed DMRs.</strong>{" "}
          <span className="text-[12px]">
            Statistical tests unavailable in demo. No p-values or FDR are shown.
          </span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <GroupSelector
          label="Group A"
          accent="#5065A8"
          dimension={dimensionA}
          value={valueA}
          options={options}
          cells={cellsA}
          onDimensionChange={(dimension) => chooseDimension("A", dimension)}
          onValueChange={(value) => {
            setValueA(value);
            setPreview(null);
          }}
        />
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="btn btn-secondary h-9 w-9 px-0"
            onClick={swap}
            aria-label="Swap group A and group B"
            title="Swap groups"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>
        <GroupSelector
          label="Group B"
          accent="#158F80"
          dimension={dimensionB}
          value={valueB}
          options={options}
          cells={cellsB}
          onDimensionChange={(dimension) => chooseDimension("B", dimension)}
          onValueChange={(value) => {
            setValueB(value);
            setPreview(null);
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-faint">
        <p>
          Aggregation: mean of synthetic cell-level predicted β, cells pooled
          within each group. No donor weighting, no inferential test.
        </p>
        <button type="button" className="btn btn-quiet h-7 px-2 text-[11px]" onClick={reset}>
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reset comparison
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel overflow-hidden" aria-labelledby="means-heading">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 id="means-heading" className="text-[14px] font-semibold text-ink">
                Group means
              </h2>
              <p className="text-[11px] text-ink-faint">
                Synthetic predicted β per demo panel CpG
              </p>
            </div>
            <Badge tone="primary" dot>
              Synthetic demo
            </Badge>
          </header>
          <div className="px-4 py-3">
            <div className="grid grid-cols-[94px_1fr_44px] items-center gap-2 border-b border-line pb-1.5 text-[10px] uppercase text-ink-faint">
              <span>CpG</span>
              <span>Group mean</span>
              <span className="text-right">Δ</span>
            </div>
            <div className="divide-y divide-line">
              {cpgIds.map((cpgId, index) => {
                const a = meansA[index]?.value;
                const b = meansB[index]?.value;
                const delta = a !== null && b !== null ? b - a : null;
                return (
                  <div
                    key={cpgId}
                    className="grid grid-cols-[94px_1fr_44px] items-center gap-2 py-2"
                  >
                    <span className="mono text-[10px] text-ink">{cpgId}</span>
                    <span className="grid gap-1">
                      <span className="relative block h-2 bg-paper-deep" aria-hidden="true">
                        <span
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${(a ?? 0) * 100}%`, backgroundColor: "#5065A8" }}
                        />
                      </span>
                      <span className="relative block h-2 bg-paper-deep" aria-hidden="true">
                        <span
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${(b ?? 0) * 100}%`, backgroundColor: "#158F80" }}
                        />
                      </span>
                    </span>
                    <span className="tabular text-right text-[11px] text-ink">
                      {delta === null ? "—" : delta.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 border-t border-line pt-2 text-[10px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2" style={{ backgroundColor: "#5065A8" }} aria-hidden="true" />
                Group A · {valueA}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2" style={{ backgroundColor: "#158F80" }} aria-hidden="true" />
                Group B · {valueB}
              </span>
            </div>
          </div>
        </section>

        <ChartFrame
          title="Δ predicted methylation heatmap"
          eyebrow="Comparison space"
          description="Δ = group B − group A within each cell type. This is a layout placeholder, not a DMR result."
          state={heatmapState.state}
          onStateChange={heatmapState.setState}
          bodyClassName="min-h-[300px]"
          legend={<DeltaColorBar />}
          footer="Statistical tests unavailable in demo. No p-values, FDR, or DMR calls are generated."
        >
          <DeltaHeatmap
            cpgIds={cpgIds}
            cellTypes={availableCellTypes}
            cellsA={cellsA}
            cellsB={cellsB}
          />
        </ChartFrame>
      </div>

      <section className="panel mt-4 p-4" aria-labelledby="estimand-heading">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 id="estimand-heading" className="text-[14px] font-semibold text-ink">
              Comparison contract
            </h2>
            <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-ink-soft">
              Group A: <span className="mono">{dimensionA}:{valueA}</span> ·{" "}
              {cellsA.length} synthetic cells. Group B:{" "}
              <span className="mono">{dimensionB}:{valueB}</span> · {cellsB.length}{" "}
              synthetic cells. The estimator is an unweighted mean of synthetic
              cell-level predicted β. A production release must add per-cell
              provenance, donor-aware aggregation, and a pre-registered
              statistical plan before any inference is shown.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary h-8 text-[12px]"
            onClick={runApiPreview}
            disabled={previewStatus === "loading"}
          >
            {previewStatus === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            {previewStatus === "loading" ? "Calling demo API" : "Preview API response"}
          </button>
        </div>
        {previewStatus === "error" ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-warm" role="alert">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {previewError}
          </p>
        ) : null}
        {preview ? (
          <div className="mt-3 border border-line bg-paper-tint px-3 py-2.5 text-[11px] text-ink-soft">
            <p>
              <span className="font-medium text-ink">statistical_tests:</span>{" "}
              <span className="mono">{preview.statistical_tests}</span> ·{" "}
              <span className="font-medium text-ink">group_a.n_cells:</span>{" "}
              <span className="mono">{preview.group_a.n_cells}</span> ·{" "}
              <span className="font-medium text-ink">group_b.n_cells:</span>{" "}
              <span className="mono">{preview.group_b.n_cells}</span>
            </p>
            <p className="mt-1 text-ink-faint">{preview.caveat}</p>
          </div>
        ) : null}
      </section>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-faint">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Group sizes differ by design in this mock. Do not interpret bar height,
        group size, or Δ as biological evidence.
      </p>
    </div>
  );
}
