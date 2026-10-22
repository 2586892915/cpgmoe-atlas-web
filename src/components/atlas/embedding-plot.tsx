"use client";

import { useMemo, useRef, useState } from "react";
import type { CellRecord } from "@/lib/schemas";
import { colorForCategory, viridis } from "@/lib/colors";

type Point = { x: number; y: number };

export type ColorBy = "cell_type" | "disease" | "methylation";

export function EmbeddingPlot({
  cells,
  colorBy,
  categories,
  selectedIds,
  onSelectionChange,
}: {
  cells: CellRecord[];
  colorBy: ColorBy;
  categories: string[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: string[], additive: boolean) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<{
    cell: CellRecord;
    left: number;
    top: number;
  } | null>(null);
  const [brush, setBrush] = useState<{ start: Point; current: Point; additive: boolean } | null>(
    null,
  );

  const pointColor = (cell: CellRecord) => {
    if (colorBy === "methylation") return viridis(cell.predicted_beta_demo);
    if (colorBy === "disease") return colorForCategory(cell.disease, categories);
    return colorForCategory(cell.cell_type, categories);
  };

  const ordered = useMemo(() => {
    const unselected = cells.filter((cell) => !selectedIds.has(cell.cell_id));
    const selected = cells.filter((cell) => selectedIds.has(cell.cell_id));
    return [...unselected, ...selected];
  }, [cells, selectedIds]);

  const toViewBox = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  };

  const brushRect = brush
    ? {
        x: Math.min(brush.start.x, brush.current.x),
        y: Math.min(brush.start.y, brush.current.y),
        width: Math.abs(brush.start.x - brush.current.x),
        height: Math.abs(brush.start.y - brush.current.y),
      }
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Synthetic UMAP embedding of ${cells.length} cells coloured by ${
          colorBy === "methylation" ? "predicted beta" : colorBy.replace("_", " ")
        }. Use the accessible cell table for keyboard selection.`}
        className="block aspect-square w-full max-h-[540px] touch-none select-none"
        onPointerDown={(event) => {
          if ((event.target as SVGElement).dataset.bg !== "true") return;
          const point = toViewBox(event.clientX, event.clientY);
          if (!point) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setBrush({ start: point, current: point, additive: event.shiftKey });
        }}
        onPointerMove={(event) => {
          if (!brush) return;
          const point = toViewBox(event.clientX, event.clientY);
          if (!point) return;
          setBrush({ ...brush, current: point });
        }}
        onPointerUp={() => {
          if (!brush) return;
          const rect = {
            x1: Math.min(brush.start.x, brush.current.x),
            x2: Math.max(brush.start.x, brush.current.x),
            y1: Math.min(brush.start.y, brush.current.y),
            y2: Math.max(brush.start.y, brush.current.y),
          };
          const ids = cells
            .filter(
              (cell) =>
                cell.x >= rect.x1 &&
                cell.x <= rect.x2 &&
                cell.y >= rect.y1 &&
                cell.y <= rect.y2,
            )
            .map((cell) => cell.cell_id);
          if (ids.length > 0) onSelectionChange(ids, brush.additive);
          setBrush(null);
        }}
        onPointerCancel={() => setBrush(null)}
      >
        <rect data-bg="true" x="0" y="0" width="100" height="100" fill="#FCFDFD" />
        {[20, 40, 60, 80].map((value) => (
          <g key={value} aria-hidden="true">
            <line x1={value} y1="2" x2={value} y2="98" stroke="#EAF1F3" strokeWidth="0.25" />
            <line x1="2" y1={value} x2="98" y2={value} stroke="#EAF1F3" strokeWidth="0.25" />
          </g>
        ))}
        <rect
          data-bg="true"
          x="2"
          y="2"
          width="96"
          height="96"
          fill="none"
          stroke="#D7E2E5"
          strokeWidth="0.3"
        />
        {ordered.map((cell) => {
          const selected = selectedIds.has(cell.cell_id);
          return (
            <circle
              key={cell.cell_id}
              cx={cell.x}
              cy={cell.y}
              r={selected ? 1.15 : 0.78}
              fill={pointColor(cell)}
              stroke={selected ? "#17262E" : "#FFFFFF"}
              strokeWidth={selected ? 0.45 : 0.16}
              opacity={selected ? 1 : 0.88}
              className="cursor-pointer"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelectionChange([cell.cell_id], event.shiftKey);
              }}
              onPointerEnter={(event) => {
                const wrapper = wrapperRef.current?.getBoundingClientRect();
                if (!wrapper) return;
                setHovered({
                  cell,
                  left: event.clientX - wrapper.left,
                  top: event.clientY - wrapper.top,
                });
              }}
              onPointerMove={(event) => {
                const wrapper = wrapperRef.current?.getBoundingClientRect();
                if (!wrapper || !hovered) return;
                setHovered({
                  cell: hovered.cell,
                  left: event.clientX - wrapper.left,
                  top: event.clientY - wrapper.top,
                });
              }}
              onPointerLeave={() => setHovered(null)}
            >
              <title>{`${cell.cell_id} · ${cell.cell_type} · synthetic β ${cell.predicted_beta_demo.toFixed(3)}`}</title>
            </circle>
          );
        })}
        {brushRect && brushRect.width > 0.3 ? (
          <rect
            x={brushRect.x}
            y={brushRect.y}
            width={brushRect.width}
            height={brushRect.height}
            fill="rgba(21,110,134,0.10)"
            stroke="#156E86"
            strokeWidth="0.35"
            strokeDasharray="1.2 0.8"
            pointerEvents="none"
          />
        ) : null}
        <text x="50" y="99.2" textAnchor="middle" fontSize="2.1" fill="#6B7F88">
          UMAP-1 (synthetic)
        </text>
        <text
          x="1.6"
          y="50"
          textAnchor="middle"
          fontSize="2.1"
          fill="#6B7F88"
          transform="rotate(-90 1.6 50)"
        >
          UMAP-2 (synthetic)
        </text>
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute z-20 min-w-[170px] border border-line bg-white px-2.5 py-2 text-[11px] shadow-float"
          style={{
            left: Math.min(hovered.left + 12, (wrapperRef.current?.clientWidth ?? 300) - 190),
            top: Math.max(8, hovered.top - 64),
            borderRadius: 3,
          }}
          role="tooltip"
        >
          <p className="mono text-[10px] text-ink-faint">{hovered.cell.cell_id}</p>
          <p className="mt-0.5 font-medium text-ink">{hovered.cell.cell_type}</p>
          <p className="text-ink-soft">
            {hovered.cell.dataset_id} · {hovered.cell.disease}
          </p>
          <p className="tabular mt-1 text-primary">
            synthetic β {hovered.cell.predicted_beta_demo.toFixed(3)}
          </p>
        </div>
      ) : null}

      <p className="border-t border-line bg-paper-tint/60 px-3 py-1.5 text-[10px] text-ink-faint">
        Click a cell to select · Shift-click to add · Drag on the background to
        brush-select · No donor identifiers are shown
      </p>
    </div>
  );
}
