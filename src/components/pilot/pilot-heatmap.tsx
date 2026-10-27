"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type HeatmapRow = {
  label: string;
  n_cells: number;
  group_id?: number;
  values: number[];
};

export type HeatmapData = {
  cpg_ids: string[];
  organ_systems: HeatmapRow[];
  top_groups: HeatmapRow[];
  scale: number;
};

const LABEL_WIDTH = 168;
const ROW_HEIGHT = 18;
const PAD_TOP = 18;

function colorFor(value: number) {
  const stops: [number, number, number, number][] = [
    [0, 0xea, 0xf2, 0xf5],
    [0.5, 0x15, 0x6e, 0x86],
    [1, 0xa3, 0x6a, 0x1f],
  ];
  const clamped = Math.max(0, Math.min(1, value));
  let left = stops[0];
  let right = stops[2];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      left = stops[i];
      right = stops[i + 1];
      break;
    }
  }
  const span = right[0] - left[0] || 1;
  const t = (clamped - left[0]) / span;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(left[1], right[1])}, ${mix(left[2], right[2])}, ${mix(
    left[3],
    right[3],
  )})`;
}

export function PilotHeatmap({ data }: { data: HeatmapData }) {
  const router = useRouter();
  const [view, setView] = useState<"organ" | "group">("organ");
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    cpg: string;
    value: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const rows = view === "organ" ? data.organ_systems : data.top_groups;
  const columns = data.cpg_ids.length;

  const geometry = useMemo(
    () => ({ rows: rows.length, columns, labelWidth: LABEL_WIDTH }),
    [rows.length, columns],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = wrap.clientWidth;
    const height = PAD_TOP + rows.length * ROW_HEIGHT + 6;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const gridWidth = Math.max(120, width - geometry.labelWidth - 8);
    const cellWidth = gridWidth / columns;

    context.font =
      '10px Inter, "Segoe UI", Arial, sans-serif';
    context.textBaseline = "middle";

    rows.forEach((row, rowIndex) => {
      const y = PAD_TOP + rowIndex * ROW_HEIGHT;
      context.fillStyle = "#3D535D";
      const label = row.label.length > 30 ? `${row.label.slice(0, 29)}…` : row.label;
      context.fillText(label, 0, y + ROW_HEIGHT / 2);
      for (let column = 0; column < columns; column += 1) {
        const value = row.values[column] / data.scale;
        context.fillStyle = colorFor(value);
        context.fillRect(
          geometry.labelWidth + column * cellWidth,
          y,
          Math.ceil(cellWidth) + 0.5,
          ROW_HEIGHT - 1,
        );
      }
    });
  }, [rows, columns, data.scale, geometry.labelWidth]);

  function handleMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rowIndex = Math.floor((y - PAD_TOP) / ROW_HEIGHT);
    if (rowIndex < 0 || rowIndex >= rows.length) {
      setHover(null);
      return;
    }
    const gridWidth = rect.width - geometry.labelWidth - 8;
    const cellWidth = gridWidth / columns;
    const column = Math.floor((x - geometry.labelWidth) / cellWidth);
    if (column < 0 || column >= columns) {
      setHover(null);
      return;
    }
    const row = rows[rowIndex];
    setHover({
      x,
      y,
      label: row.label,
      cpg: data.cpg_ids[column],
      value: row.values[column] / data.scale,
    });
  }

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const rowIndex = Math.floor((event.clientY - rect.top - PAD_TOP) / ROW_HEIGHT);
    const row = rows[rowIndex];
    if (!row) return;
    const gridWidth = rect.width - geometry.labelWidth - 8;
    const cellWidth = gridWidth / columns;
    const column = Math.floor((x - geometry.labelWidth) / cellWidth);
    if (x >= geometry.labelWidth && column >= 0 && column < columns) {
      const cpg = data.cpg_ids[column];
      router.push(`/browser?q=${cpg}&cpg=${cpg}`);
      return;
    }
    if (view === "group" && row.group_id !== undefined) {
      router.push(`/groups/${row.group_id}`);
    } else {
      router.push(`/groups?organ_system=${encodeURIComponent(row.label)}`);
    }
  }

  function downloadCsv() {
    const header = ["label", "n_cells", ...data.cpg_ids].join(",");
    const lines = rows.map((row) =>
      [
        `"${row.label.replace(/"/g, '""')}"`,
        row.n_cells,
        ...row.values.map((value) => (value / data.scale).toFixed(3)),
      ].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cpgmoe_pilot_${view === "organ" ? "organ_systems" : "top_groups"}_512cpg.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {[
            { id: "organ" as const, label: `Organ systems (${data.organ_systems.length})` },
            { id: "group" as const, label: `Top groups (${data.top_groups.length})` },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={`border px-2.5 py-1 text-[11px] transition-colors ${
                view === option.id
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink-soft hover:border-primary/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-ink-faint">
          <span>0</span>
          <span
            className="h-2 w-28"
            style={{
              background:
                "linear-gradient(90deg, rgb(234,242,245), rgb(21,110,134), rgb(163,106,31))",
            }}
          />
          <span>1</span>
          <span className="ml-1">predicted β</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-faint">
        <span>{rows.length} rows</span>
        <span>·</span>
        <span>{columns} CpGs</span>
        <span>·</span>
        <span>click a cell for its CpG, a label for the group</span>
        <button
          type="button"
          onClick={downloadCsv}
          className="ml-auto text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          Download CSV
        </button>
      </div>

      <div ref={wrapRef} className="relative mt-1 w-full overflow-x-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onClick={handleClick}
          className="block cursor-pointer"
          role="img"
          aria-label="Predicted methylation beta heatmap by group and CpG"
        />
        {hover ? (
          <div
            className="pointer-events-none absolute z-10 border border-line bg-white px-2 py-1 text-[10px] shadow-panel"
            style={{
              left: Math.min(hover.x + 12, 900),
              top: Math.max(0, hover.y - 34),
            }}
          >
            <p className="font-medium text-ink">{hover.label}</p>
            <p className="mono text-ink-faint">
              {hover.cpg} · β {hover.value.toFixed(3)}
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Rows: {view === "organ" ? "16 organ systems (cell-weighted)" : "48 largest groups"}.
        Cells are group means of predicted β, not measurements.
      </p>
    </div>
  );
}
