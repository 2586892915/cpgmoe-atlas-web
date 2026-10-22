"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import { EmbeddingPlot, type ColorBy } from "@/components/atlas/embedding-plot";
import { GroupMethylationPlot } from "@/components/atlas/group-methylation-plot";
import { SelectedCellsPanel } from "@/components/atlas/selected-cells-panel";
import { ChartFrame, useVizState } from "@/components/chart-frame";
import { BetaColorBar } from "@/components/color-bar";
import { Badge } from "@/components/ui/badge";
import { groupSummaryByCellType } from "@/mock/methylation";
import { CATEGORICAL_COLORS } from "@/lib/colors";
import type { CellRecord, CpgRecord, DatasetDetail } from "@/lib/schemas";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label htmlFor={id} className="micro-label mb-1 block">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field h-9 text-[12px]"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Legend({
  categories,
  counts,
  colorBy,
}: {
  categories: string[];
  counts: Record<string, number>;
  colorBy: ColorBy;
}) {
  if (colorBy === "methylation") {
    return <BetaColorBar label="Predicted β (synthetic)" />;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {categories.map((category, index) => (
        <span key={category} className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
          <span
            className="h-2.5 w-2.5"
            style={{ backgroundColor: CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length], borderRadius: 2 }}
            aria-hidden="true"
          />
          {category}
          <span className="tabular text-[10px] text-ink-faint">{counts[category] ?? 0}</span>
        </span>
      ))}
      <span className="text-[10px] text-ink-faint">Synthetic values</span>
    </div>
  );
}

export function AtlasExplorer({
  datasets,
  cells,
  cpgOptions,
  initialDatasetId,
}: {
  datasets: DatasetDetail[];
  cells: CellRecord[];
  cpgOptions: CpgRecord[];
  initialDatasetId?: string;
}) {
  const [datasetId, setDatasetId] = useState(
    initialDatasetId && datasets.some((dataset) => dataset.dataset_id === initialDatasetId)
      ? initialDatasetId
      : "",
  );
  const [tissue, setTissue] = useState("");
  const [disease, setDisease] = useState("");
  const [cellType, setCellType] = useState("");
  const [colorBy, setColorBy] = useState<ColorBy>("cell_type");
  const [cpgId, setCpgId] = useState(cpgOptions[0]?.cpg_id ?? "cgDEMO0001");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const embeddingState = useVizState("demo");
  const groupState = useVizState("demo");

  const filterCells = (next: {
    datasetId?: string;
    tissue?: string;
    disease?: string;
    cellType?: string;
  }) => {
    if (next.datasetId !== undefined) setDatasetId(next.datasetId);
    if (next.tissue !== undefined) setTissue(next.tissue);
    if (next.disease !== undefined) setDisease(next.disease);
    if (next.cellType !== undefined) setCellType(next.cellType);
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setDatasetId("");
    setTissue("");
    setDisease("");
    setCellType("");
    setSelectedIds(new Set());
  };

  const tissues = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.tissue))).sort(),
    [cells],
  );
  const diseases = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.disease))).sort(),
    [cells],
  );
  const cellTypes = useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.cell_type))).sort(),
    [cells],
  );

  const filteredCells = useMemo(
    () =>
      cells.filter((cell) => {
        if (datasetId && cell.dataset_id !== datasetId) return false;
        if (tissue && cell.tissue !== tissue) return false;
        if (disease && cell.disease !== disease) return false;
        if (cellType && cell.cell_type !== cellType) return false;
        return true;
      }),
    [cells, datasetId, tissue, disease, cellType],
  );

  const categories = useMemo(() => {
    if (colorBy === "cell_type") {
      return Array.from(new Set(filteredCells.map((cell) => cell.cell_type))).sort();
    }
    if (colorBy === "disease") {
      return Array.from(new Set(filteredCells.map((cell) => cell.disease))).sort();
    }
    return [];
  }, [filteredCells, colorBy]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    filteredCells.forEach((cell) => {
      const key = colorBy === "disease" ? cell.disease : cell.cell_type;
      result[key] = (result[key] ?? 0) + 1;
    });
    return result;
  }, [filteredCells, colorBy]);

  const groups = useMemo(
    () => groupSummaryByCellType(filteredCells, cpgId),
    [filteredCells, cpgId],
  );
  const selectedCells = useMemo(
    () => filteredCells.filter((cell) => selectedIds.has(cell.cell_id)),
    [filteredCells, selectedIds],
  );
  const selectedCellTypes = useMemo(
    () => new Set(selectedCells.map((cell) => cell.cell_type)),
    [selectedCells],
  );
  const activeCpG = cpgOptions.find((cpg) => cpg.cpg_id === cpgId);

  const onSelectionChange = (ids: string[], additive: boolean) => {
    setSelectedIds((current) => {
      if (!additive) return new Set(ids);
      const next = new Set(current);
      ids.forEach((id) => {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const onSelectGroup = (groupLabel: string) => {
    const groupCells = filteredCells.filter((cell) => cell.cell_type === groupLabel);
    const allSelected = groupCells.every((cell) => selectedIds.has(cell.cell_id));
    setSelectedIds((current) => {
      const next = new Set(current);
      groupCells.forEach((cell) => {
        if (allSelected) next.delete(cell.cell_id);
        else next.add(cell.cell_id);
      });
      return next;
    });
  };

  const filterControls = (
    <div className="grid gap-3">
      <FilterSelect
        id="atlas-dataset"
        label="Dataset"
        value={datasetId}
        onChange={(value) => filterCells({ datasetId: value })}
        allLabel="All eligible datasets"
        options={datasets.map((dataset) => ({
          value: dataset.dataset_id,
          label: `${dataset.dataset_id} · ${dataset.tissue}`,
        }))}
      />
      <FilterSelect
        id="atlas-tissue"
        label="Tissue"
        value={tissue}
        onChange={(value) => filterCells({ tissue: value })}
        allLabel="All tissues"
        options={tissues.map((value) => ({ value, label: value }))}
      />
      <FilterSelect
        id="atlas-disease"
        label="Disease"
        value={disease}
        onChange={(value) => filterCells({ disease: value })}
        allLabel="All diseases"
        options={diseases.map((value) => ({ value, label: value }))}
      />
      <FilterSelect
        id="atlas-celltype"
        label="Cell type"
        value={cellType}
        onChange={(value) => filterCells({ cellType: value })}
        allLabel="All cell types"
        options={cellTypes.map((value) => ({ value, label: value }))}
      />
      <div className="flex items-center justify-between border-t border-line pt-3">
        <p className="text-[11px] text-ink-faint">
          <span className="tabular font-semibold text-ink">{filteredCells.length}</span> of{" "}
          <span className="tabular">{cells.length}</span> cells
        </p>
        <button type="button" className="btn btn-quiet h-7 px-2 text-[11px]" onClick={resetFilters}>
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reset
        </button>
      </div>
      <div className="border border-line bg-paper-tint px-3 py-2 text-[10px] leading-relaxed text-ink-faint">
        <p className="font-medium text-ink-soft">Large-scale rendering plan</p>
        <p className="mt-1">
          Production will use density tiles, level-of-detail, and decimation.
          The browser never receives millions of raw points.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-shell px-0">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-white lg:block">
          <div className="sticky top-14 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Filter className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Filters
            </p>
            {filterControls}
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold leading-tight text-ink">
                Live view
              </h2>
              <p className="mt-1 text-[12px] text-ink-faint">
                Synthetic embedding · {filteredCells.length} cells in view · GRCh38
                demo panel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary lg:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                Filters
              </button>
              <Badge tone="primary" dot>
                Mock embedding
              </Badge>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2 border-y border-line py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Colour cells by">
              <span className="mr-1 text-[11px] text-ink-faint">Colour by</span>
              {[
                { value: "cell_type" as const, label: "Cell type" },
                { value: "disease" as const, label: "Disease" },
                { value: "methylation" as const, label: "Predicted β" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={colorBy === option.value}
                  onClick={() => setColorBy(option.value)}
                  className={`border px-2.5 py-1 text-[11px] ${
                    colorBy === option.value
                      ? "border-primary bg-primary-wash font-medium text-primary"
                      : "border-line bg-white text-ink-soft hover:bg-paper-tint"
                  }`}
                  style={{ borderRadius: 3 }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-ink-faint">
              Colour is never the sole encoding; values remain available in the
              table and tooltip.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <ChartFrame
              title="Cell embedding"
              eyebrow="Cell Atlas"
              description="Synthetic two-dimensional embedding. Points are demo cells, not audited observations."
              state={embeddingState.state}
              onStateChange={embeddingState.setState}
              bodyClassName="min-h-[360px]"
              legend={
                <Legend categories={categories} counts={counts} colorBy={colorBy} />
              }
              footer="Density tiles, clustering overlays, and decimation adapters are reserved for production."
            >
              <EmbeddingPlot
                cells={filteredCells}
                colorBy={colorBy}
                categories={categories}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
              />
            </ChartFrame>

            <div className="grid content-start gap-4">
              <ChartFrame
                title="Methylation per group"
                eyebrow="Predicted β"
                description="Mean synthetic predicted beta by cell type. Click a row to select that group."
                state={groupState.state}
                onStateChange={groupState.setState}
                bodyClassName="min-h-[260px]"
                actions={
                  <label className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                    <span className="hidden sm:inline">CpG</span>
                    <select
                      aria-label="Select CpG"
                      value={cpgId}
                      onChange={(event) => setCpgId(event.target.value)}
                      className="h-7 max-w-[150px] border border-line bg-white px-1.5 text-[11px] text-ink-soft focus:border-primary focus:outline-none"
                      style={{ borderRadius: 3 }}
                    >
                      {cpgOptions.map((cpg) => (
                        <option key={cpg.cpg_id} value={cpg.cpg_id}>
                          {cpg.cpg_id} · {cpg.gene_symbol}
                        </option>
                      ))}
                    </select>
                  </label>
                }
                footer="No p-values, FDR, or DMR calls. Group sizes are synthetic cell counts."
              >
                <GroupMethylationPlot
                  groups={groups}
                  selectedCellTypes={selectedCellTypes}
                  onSelectGroup={onSelectGroup}
                />
              </ChartFrame>

              <SelectedCellsPanel
                cells={selectedCells}
                cpgId={cpgId}
                cpgLabel={activeCpG?.gene_symbol ?? "Demo panel CpG"}
                onClear={() => setSelectedIds(new Set())}
              />
            </div>
          </div>

          <details className="mt-4 border border-line bg-white">
            <summary className="cursor-pointer px-4 py-2.5 text-[12px] font-medium text-ink-soft">
              Accessible cell table (keyboard selection)
            </summary>
            <div className="max-h-72 overflow-auto border-t border-line">
              <table className="data-table min-w-[720px]">
                <caption className="sr-only">
                  Synthetic cells in the current atlas view. Use checkboxes to
                  build a selection without a pointer.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-10">Select</th>
                    <th scope="col">Cell</th>
                    <th scope="col">Dataset</th>
                    <th scope="col">Cell type</th>
                    <th scope="col">Disease</th>
                    <th scope="col" className="text-right">Synthetic β</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCells.slice(0, 120).map((cell) => (
                    <tr key={cell.cell_id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${cell.cell_id}`}
                          checked={selectedIds.has(cell.cell_id)}
                          onChange={() =>
                            onSelectionChange([cell.cell_id], true)
                          }
                          className="h-3.5 w-3.5 accent-[#156E86]"
                        />
                      </td>
                      <td className="mono text-[10px] text-ink">{cell.cell_id}</td>
                      <td className="text-[11px]">{cell.dataset_id}</td>
                      <td className="text-[11px]">{cell.cell_type}</td>
                      <td className="text-[11px]">{cell.disease}</td>
                      <td className="tabular text-right text-[11px]">
                        {cell.predicted_beta_demo.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCells.length > 120 ? (
                <p className="px-4 py-2 text-[10px] text-ink-faint">
                  Showing the first 120 of {filteredCells.length} cells.
                </p>
              ) : null}
            </div>
          </details>
        </div>
      </div>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Atlas filters"
        >
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[300px] overflow-y-auto border-r border-line bg-white p-4 shadow-float">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
                Filters
              </p>
              <button
                type="button"
                className="btn btn-quiet h-8 w-8 px-0"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterControls}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
