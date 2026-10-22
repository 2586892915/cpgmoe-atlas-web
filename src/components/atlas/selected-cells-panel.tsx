"use client";

import { useState } from "react";
import { ArrowRight, Loader2, MousePointerClick, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CellRecord, PredictionPreviewResponse } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";

export function SelectedCellsPanel({
  cells,
  cpgId,
  cpgLabel,
  onClear,
}: {
  cells: CellRecord[];
  cpgId: string;
  cpgLabel: string;
  onClear: () => void;
}) {
  const [preview, setPreview] = useState<PredictionPreviewResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const meanBeta =
    cells.length > 0
      ? cells.reduce((sum, cell) => sum + cell.predicted_beta_demo, 0) / cells.length
      : null;
  const datasetIds = Array.from(new Set(cells.map((cell) => cell.dataset_id)));
  const previewDataset = datasetIds[0];
  const previewCells = cells.filter((cell) => cell.dataset_id === previewDataset).slice(0, 24);
  const cellTypes = Array.from(new Set(cells.map((cell) => cell.cell_type)));

  const runPreview = async () => {
    if (!previewDataset) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/v1/preview/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: previewDataset,
          cpg_ids: [cpgId],
          cell_ids: previewCells.map((cell) => cell.cell_id),
        }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: { message?: string } }).error?.message ?? "Preview failed")
            : "Preview failed";
        throw new Error(message);
      }
      const payload = (await response.json()) as PredictionPreviewResponse;
      setPreview(payload);
      setStatus("idle");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Preview failed");
    }
  };

  if (cells.length === 0) {
    return (
      <section className="panel p-4" aria-labelledby="selection-heading">
        <div className="flex items-center justify-between">
          <h2 id="selection-heading" className="text-[14px] font-semibold text-ink">
            Selected cells
          </h2>
          <Badge tone="primary" dot>
            Synthetic demo
          </Badge>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 py-6 text-center">
          <MousePointerClick className="h-6 w-6 text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-medium text-ink">No cells selected</p>
          <p className="max-w-xs text-[12px] leading-relaxed text-ink-faint">
            Click a point in the embedding, drag a rectangle, or use the
            accessible cell table to build a selection.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden" aria-labelledby="selection-heading">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h2 id="selection-heading" className="text-[14px] font-semibold text-ink">
            Selected cells
          </h2>
          <p className="text-[11px] text-ink-faint">
            {cells.length} cell{cells.length === 1 ? "" : "s"} ·{" "}
            {cellTypes.length} cell type{cellTypes.length === 1 ? "" : "s"} ·{" "}
            {datasetIds.length} dataset{datasetIds.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="primary" dot>
            Synthetic demo
          </Badge>
          <button type="button" className="btn btn-quiet h-7 px-2 text-[11px]" onClick={onClear}>
            Clear
          </button>
        </div>
      </header>

      <div className="grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] uppercase text-ink-faint">Mean synthetic β</p>
          <p className="tabular text-[20px] font-semibold text-ink">
            {meanBeta?.toFixed(3)}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] uppercase text-ink-faint">CpG context</p>
          <p className="mono mt-1 text-[12px] text-ink">{cpgId}</p>
          <p className="text-[10px] text-ink-faint">{cpgLabel}</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] uppercase text-ink-faint">Cell types</p>
          <p className="text-[12px] leading-relaxed text-ink-soft">
            {cellTypes.slice(0, 3).join(", ")}
            {cellTypes.length > 3 ? ` +${cellTypes.length - 3}` : ""}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-line">
        <table className="data-table min-w-[400px]">
          <caption className="sr-only">Selected synthetic cells</caption>
          <thead>
            <tr>
              <th scope="col">Cell</th>
              <th scope="col">Dataset</th>
              <th scope="col">Cell type</th>
              <th scope="col" className="text-right">Synthetic β</th>
            </tr>
          </thead>
          <tbody>
            {cells.slice(0, 8).map((cell) => (
              <tr key={cell.cell_id}>
                <td className="mono text-[10px] text-ink">{cell.cell_id}</td>
                <td className="text-[11px]">{cell.dataset_id}</td>
                <td className="text-[11px]">{cell.cell_type}</td>
                <td className="tabular text-right text-[11px]">
                  {cell.predicted_beta_demo.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cells.length > 8 ? (
        <p className="border-t border-line px-4 py-1.5 text-[10px] text-ink-faint">
          Showing 8 of {cells.length} selected cells.
        </p>
      ) : null}

      <div className="border-t border-line bg-paper-tint/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium text-ink">
              Preview predicted β for this selection
            </p>
            <p className="text-[10px] text-ink-faint">
              Calls the demo endpoint. No checkpoint is loaded; values are synthetic.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary h-8 text-[12px]"
            onClick={runPreview}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {status === "loading" ? "Running preview" : "Preview demo API"}
          </button>
        </div>

        {status === "error" ? (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-warm" role="alert">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {preview ? (
          <div className="mt-3 border border-line bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone="primary" dot>
                {preview.is_synthetic_demo ? "Synthetic response" : "Response"}
              </Badge>
              <span className="mono text-[10px] text-ink-faint">{preview.provenance_id}</span>
            </div>
            <table className="data-table mt-2">
              <caption className="sr-only">Demo prediction preview</caption>
              <thead>
                <tr>
                  <th scope="col">Cell</th>
                  <th scope="col">CpG</th>
                  <th scope="col" className="text-right">Predicted β</th>
                </tr>
              </thead>
              <tbody>
                {preview.predictions.slice(0, 6).map((prediction, index) => (
                  <tr key={`${prediction.cell_id}-${prediction.cpg_id}-${index}`}>
                    <td className="mono text-[10px]">{prediction.cell_id}</td>
                    <td className="mono text-[10px]">{prediction.cpg_id}</td>
                    <td className="tabular text-right text-[11px]">
                      {prediction.predicted_beta.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              {preview.caveat}
            </p>
          </div>
        ) : null}
        {datasetIds.length > 1 ? (
          <p className="mt-2 text-[10px] text-ink-faint">
            Preview calls the demo endpoint with cells from{" "}
            <span className="mono">{previewDataset}</span> only; other selected
            datasets are not sent.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px]">
        <span className="text-ink-faint">
          Selection is in-memory only; nothing is uploaded.
        </span>
        <Link className="link-quiet inline-flex items-center gap-1" href="/compare">
          Compare groups
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
