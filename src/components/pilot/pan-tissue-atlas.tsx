"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import {
  ChromosomeRing,
  type ChromosomeEntry,
} from "@/components/pilot/chromosome-ring";

type OrganRow = {
  group_index: number;
  label: string;
  n_cells: number;
  values: number[];
};

type Bin = {
  index: number;
  chr: string;
  start: number;
  end: number;
  n_cpgs: number;
  first_pos: number;
  last_pos: number;
};

type Cpg = {
  cpg_id: string;
  chr: string;
  pos: number;
  genes: string | null;
};

type AtlasPayload = {
  mode: "overview" | "chromosome" | "window";
  chromosome: string;
  n_cpgs_total: number;
  start: number;
  end: number;
  bins?: Bin[];
  organs: OrganRow[];
  cpgs?: Cpg[];
  focus?: string;
  chromosomes: ChromosomeEntry[];
};

const LABEL_WIDTH = 154;
const ROW_HEIGHT = 22;
const PAD_TOP = 12;
const AXIS_HEIGHT = 34;

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBp(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mb`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} kb`;
  return `${value} bp`;
}

function colorFor(value: number) {
  const stops: [number, number, number, number][] = [
    [0, 0xea, 0xf2, 0xf5],
    [0.5, 0x15, 0x6e, 0x86],
    [1, 0xa3, 0x6a, 0x1f],
  ];
  const clamped = Math.max(0, Math.min(1, value));
  let left = stops[0];
  let right = stops[2];
  for (let index = 0; index < stops.length - 1; index += 1) {
    if (clamped >= stops[index][0] && clamped <= stops[index + 1][0]) {
      left = stops[index];
      right = stops[index + 1];
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

function colorForDeviation(value: number) {
  const stops: [number, number, number, number][] = [
    [0, 0x21, 0x66, 0xac],
    [0.5, 0xf7, 0xf9, 0xfc],
    [1, 0xb2, 0x18, 0x2b],
  ];
  const clamped = Math.max(0, Math.min(1, value));
  const left = clamped <= 0.5 ? stops[0] : stops[1];
  const right = clamped <= 0.5 ? stops[1] : stops[2];
  const span = right[0] - left[0] || 1;
  const t = (clamped - left[0]) / span;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(left[1], right[1])}, ${mix(left[2], right[2])}, ${mix(
    left[3],
    right[3],
  )})`;
}

export function PanTissueAtlas() {
  const router = useRouter();
  const [data, setData] = useState<AtlasPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scaleMode, setScaleMode] = useState<"deviation" | "beta">("deviation");
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    title: string;
    detail: string;
    value: number;
    delta: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function load(url: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Atlas unavailable");
      setData(payload as AtlasPayload);
      setHover(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Atlas unavailable";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("/api/v1/pilot/atlas?mode=overview");
  }, []);

  function selectChromosome(chr: string) {
    if (chr === "all") {
      void load("/api/v1/pilot/atlas?mode=overview");
    } else {
      void load(`/api/v1/pilot/atlas?chr=${encodeURIComponent(chr)}&bins=320`);
    }
  }

  function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    void load(`/api/v1/pilot/atlas?q=${encodeURIComponent(query.trim())}`);
  }

  function zoomToBin(bin: Bin) {
    const center = Math.round((bin.start + bin.end) / 2);
    const start = Math.max(0, Math.min(data!.n_cpgs_total - 4096, center - 2048));
    void load(
      `/api/v1/pilot/atlas?chr=${encodeURIComponent(bin.chr)}&start=${start}&end=${start + 4096}`,
    );
  }

  const rows = useMemo(() => data?.organs ?? [], [data]);
  const columns = data?.mode === "window" ? data.cpgs?.length ?? 0 : data?.bins?.length ?? 0;
  const windowBinSize =
    data?.mode === "window" ? Math.max(1, Math.ceil(columns / 512)) : 1;
  const displayColumns =
    data?.mode === "window" ? Math.ceil(columns / windowBinSize) : columns;
  const displayValues = useMemo(() => {
    if (!rows.length) return [] as number[][];
    if (scaleMode === "beta") return rows.map((row) => row.values);
    return rows.map((row) =>
      row.values.map((value, column) => {
        const columnValues = rows.map((entry) => entry.values[column] ?? 0);
        const mean =
          columnValues.reduce((sum, item) => sum + item, 0) / columnValues.length;
        const variance =
          columnValues.reduce((sum, item) => sum + (item - mean) ** 2, 0) /
          columnValues.length;
        const sd = Math.sqrt(variance);
        const z = (value - mean) / Math.max(sd, 0.03);
        return Math.max(0, Math.min(1, (z + 2) / 4));
      }),
    );
  }, [rows, scaleMode]);
  const organSignals = useMemo(() => {
    if (!rows.length || !columns) return [];
    const means = rows.map(
      (row) =>
        row.values.reduce((sum, value) => sum + value, 0) / row.values.length,
    );
    const overall = means.reduce((sum, value) => sum + value, 0) / means.length;
    return rows
      .map((row, index) => ({
        label: row.label,
        delta: means[index] - overall,
      }))
      .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
      .slice(0, 4);
  }, [rows, columns]);
  const layout = useMemo(
    () => ({ rows: rows.length, columns: displayColumns, labelWidth: LABEL_WIDTH }),
    [rows.length, displayColumns],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !data || columns === 0) return;
    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = wrap.clientWidth;
      const bottomSpace = data.mode === "overview" ? 8 : AXIS_HEIGHT;
      const height = PAD_TOP + rows.length * ROW_HEIGHT + bottomSpace;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const gridWidth = Math.max(120, width - LABEL_WIDTH - 10);
      const columnWidth = gridWidth / displayColumns;
      context.font = '10px Inter, "Segoe UI", Arial, sans-serif';
      context.textBaseline = "middle";

      const displayValueAt = (rowIndex: number, column: number) => {
        if (data.mode !== "window") {
          return displayValues[rowIndex]?.[column] ?? 0.5;
        }
        let sum = 0;
        let count = 0;
        const start = column * windowBinSize;
        const end = Math.min(columns, start + windowBinSize);
        for (let index = start; index < end; index += 1) {
          sum += displayValues[rowIndex]?.[index] ?? 0.5;
          count += 1;
        }
        return count ? sum / count : 0.5;
      };

      rows.forEach((row, rowIndex) => {
        const y = PAD_TOP + rowIndex * ROW_HEIGHT;
        context.fillStyle = "#3D535D";
        const label = prettyLabel(row.label);
        context.fillText(
          label.length > 23 ? `${label.slice(0, 22)}…` : label,
          0,
          y + ROW_HEIGHT / 2,
        );
        for (let column = 0; column < displayColumns; column += 1) {
          context.fillStyle =
            scaleMode === "deviation"
              ? colorForDeviation(displayValueAt(rowIndex, column))
              : colorFor(
                  data.mode === "window"
                    ? row.values
                        .slice(column * windowBinSize, (column + 1) * windowBinSize)
                        .reduce((sum, value) => sum + value, 0) /
                        Math.max(1, Math.min(windowBinSize, columns - column * windowBinSize))
                    : row.values[column] ?? 0,
                );
          context.fillRect(
            LABEL_WIDTH + column * columnWidth,
            y,
            Math.ceil(columnWidth) + 0.4,
            ROW_HEIGHT - 1,
          );
        }
      });

      if (data.mode === "window" && data.focus && data.cpgs?.length) {
        const focusIndex = data.cpgs.findIndex((cpg) => cpg.cpg_id === data.focus);
        if (focusIndex >= 0) {
          const x = LABEL_WIDTH + (focusIndex + 0.5) * columnWidth;
          context.strokeStyle = "#D96A1F";
          context.lineWidth = 1.5;
          context.beginPath();
          context.moveTo(x, PAD_TOP - 4);
          context.lineTo(x, PAD_TOP + rows.length * ROW_HEIGHT);
          context.stroke();
        }
      }

      context.strokeStyle = "#DCE7F3";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(LABEL_WIDTH, PAD_TOP + rows.length * ROW_HEIGHT + 3);
      context.lineTo(width - 4, PAD_TOP + rows.length * ROW_HEIGHT + 3);
      context.stroke();

      const plotBottom = PAD_TOP + rows.length * ROW_HEIGHT;
      context.fillStyle = "#7A8CA4";
      context.font = '8px Inter, "Segoe UI", Arial, sans-serif';
      context.textBaseline = "top";

      if (data.mode === "overview") {
        data.chromosomes.forEach((entry) => {
          const x =
            LABEL_WIDTH +
            (entry.start / Math.max(1, data.end - data.start)) * gridWidth;
          if (x > LABEL_WIDTH + 1) {
            context.strokeStyle = "rgba(255,255,255,0.55)";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(x, PAD_TOP);
            context.lineTo(x, plotBottom);
            context.stroke();
          }
        });
      } else if (data.mode === "chromosome" && data.bins?.length) {
        const first = data.bins[0].first_pos;
        const last = data.bins[data.bins.length - 1].last_pos;
        [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
          const x = LABEL_WIDTH + ratio * gridWidth;
          context.textAlign = ratio === 0 ? "left" : ratio === 1 ? "right" : "center";
          context.fillText(
            formatBp(first + (last - first) * ratio),
            x,
            plotBottom + 9,
          );
          context.textAlign = "left";
        });
      } else if (data.cpgs?.length) {
        [0, 0.5, 1].forEach((ratio) => {
          const index = Math.min(
            data.cpgs!.length - 1,
            Math.floor(ratio * (data.cpgs!.length - 1)),
          );
          const cpg = data.cpgs![index];
          const x = LABEL_WIDTH + ratio * gridWidth;
          context.textAlign = ratio === 0 ? "left" : ratio === 1 ? "right" : "center";
          context.fillText(
            `${cpg.chr}:${formatBp(cpg.pos)}`,
            x,
            plotBottom + 9,
          );
          context.textAlign = "left";
        });
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [data, rows, columns, displayColumns, windowBinSize, displayValues, scaleMode]);

  function pick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !data) return null;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rowIndex = Math.floor((y - PAD_TOP) / ROW_HEIGHT);
    const gridWidth = rect.width - LABEL_WIDTH - 10;
    const column = Math.floor((x - LABEL_WIDTH) / (gridWidth / displayColumns));
    if (
      rowIndex < 0 ||
      rowIndex >= rows.length ||
      column < 0 ||
      column >= displayColumns
    ) {
      return null;
    }
    return { x, y, row: rows[rowIndex], column };
  }

  function handleMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const hit = pick(event);
    if (!hit) {
      setHover(null);
      return;
    }
    const { row, column, x, y } = hit;
    const start = column * windowBinSize;
    const end = Math.min(columns, start + windowBinSize);
    const valueAt = (values: number[]) => {
      if (data?.mode !== "window") return values[column] ?? 0;
      let sum = 0;
      for (let index = start; index < end; index += 1) sum += values[index] ?? 0;
      return sum / Math.max(1, end - start);
    };
    const columnValues = rows.map((entry) => valueAt(entry.values));
    const columnMean =
      columnValues.reduce((sum, item) => sum + item, 0) / columnValues.length;
    const beta = valueAt(row.values);
    const delta = beta - columnMean;
    if (data?.mode === "window" && data.cpgs?.length) {
      const center = data.cpgs[Math.floor((start + end) / 2)];
      setHover({
        x,
        y,
        title: center.cpg_id,
        detail: `${center.chr}:${center.pos.toLocaleString("en-US")} · ${end - start} CpGs${center.genes ? ` · ${center.genes.split(";")[0]}` : ""}`,
        value: beta,
        delta,
      });
      return;
    }
    const bin = data?.bins?.[column];
    if (!bin) {
      setHover(null);
      return;
    }
    setHover({
      x,
      y,
      title: `${bin.chr}:${bin.first_pos.toLocaleString("en-US")}–${bin.last_pos.toLocaleString("en-US")}`,
      detail: `${bin.n_cpgs} CpGs · ${prettyLabel(row.label)}`,
      value: beta,
      delta,
    });
  }

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const hit = pick(event);
    if (!hit) return;
    if (data?.mode === "window" && data.cpgs?.length) {
      const start = hit.column * windowBinSize;
      const end = Math.min(columns, start + windowBinSize);
      const cpg = data.cpgs[Math.floor((start + end) / 2)];
      router.push(`/browser?q=${cpg.cpg_id}&cpg=${cpg.cpg_id}`);
      return;
    }
    const bin = data?.bins?.[hit.column];
    if (bin) zoomToBin(bin);
  }

  if (loading && !data) {
    return (
      <div className="panel mt-5 flex min-h-[420px] items-center justify-center gap-2 text-[12px] text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        Loading the 485,403-CpG atlas
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel mt-5 border-warm/30 p-6 text-[12px] text-warm">
        {error ?? "Atlas unavailable"}
      </div>
    );
  }

  const selected = data.chromosome;
  const regionCpGs =
    data.mode === "window" ? data.cpgs?.length ?? 0 : data.end - data.start;
  const regionMb =
    data.mode === "chromosome" && data.bins?.length
      ? ((data.bins[data.bins.length - 1].last_pos - data.bins[0].first_pos) / 1_000_000).toFixed(1)
      : null;
  const topOrgan = organSignals[0];

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="panel p-4">
        <p className="micro-label">Choose a chromosome</p>
        <div className="mt-3">
          <ChromosomeRing
            chromosomes={data.chromosomes}
            selected={selected}
            total={data.n_cpgs_total}
            onSelect={selectChromosome}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line text-[10px]">
          <div className="bg-white px-2.5 py-2">
            <p className="uppercase text-ink-faint">View</p>
            <p className="mt-1 text-[12px] font-medium text-ink">
              {selected === "all" ? "All chromosomes" : selected}
            </p>
          </div>
          <div className="bg-white px-2.5 py-2">
            <p className="uppercase text-ink-faint">CpGs</p>
            <p className="tabular mt-1 text-[12px] font-medium text-ink">
              {data.mode === "window"
                ? data.cpgs?.length.toLocaleString("en-US")
                : data.n_cpgs_total.toLocaleString("en-US")}
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="micro-label">Organ signal</p>
          <p className="mt-0.5 text-[9px] text-ink-faint">
            mean Δβ vs the 16-organ mean
          </p>
          <div className="mt-2 grid gap-1.5">
            {organSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center justify-between gap-2 text-[10px]"
              >
                <span className="truncate text-ink-soft">
                  {prettyLabel(signal.label)}
                </span>
                <span
                  className={`tabular shrink-0 ${
                    signal.delta >= 0 ? "text-[#B2182B]" : "text-[#2166AC]"
                  }`}
                >
                  {signal.delta >= 0 ? "+" : ""}
                  {signal.delta.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-ink-faint">
          Arc length follows GRCh38 chromosome length. Click a chromosome, then
          click a block in the heatmap to zoom to individual CpGs.
        </p>
      </aside>

      <section className="panel min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="micro-label">Predicted β · 16 organ systems</p>
            <h2 className="mt-1 text-[20px] font-semibold text-ink">
              {data.mode === "window"
                ? (
                    <>
                      CpG window · {data.cpgs?.[0]?.chr ?? ""}
                      {data.focus ? (
                        <span className="mono ml-2 align-middle text-[11px] font-normal text-ink-faint">
                          {data.focus}
                        </span>
                      ) : null}
                    </>
                  )
                : selected === "all"
                  ? "Whole-genome overview"
                  : `${selected} · ${(data.end - data.start).toLocaleString("en-US")} CpGs`}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {data.mode === "window" ? (
              <button
                type="button"
                onClick={() => selectChromosome(selected)}
                className="border border-line bg-white px-2 py-1 text-[10px] text-ink-soft hover:border-primary/40"
              >
                ← Back to {selected}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => selectChromosome("all")}
              className={`border px-2 py-1 text-[10px] ${
                selected === "all"
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink-soft hover:border-primary/40"
              }`}
            >
              Whole genome
            </button>
          </div>
        </div>

        <form onSubmit={search} className="mt-3 flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 items-center border border-line bg-white px-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="CpG ID or gene (e.g. cg00050873, PTPRN2)"
              className="h-8 min-w-0 flex-1 bg-transparent px-2 text-[11px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <button type="submit" className="btn btn-secondary h-8 px-2.5 text-[10px]">
            Locate
          </button>
        </form>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-ink-faint">
          <span>{layout.rows} organ rows</span>
          <span>·</span>
          <span>{displayColumns.toLocaleString("en-US")} bins</span>
          <span>·</span>
          <span>{regionCpGs.toLocaleString("en-US")} CpGs</span>
          <span className="ml-auto">
            {data.mode === "window" ? "click a CpG to open it" : "click a block to zoom"}
          </span>
        </div>

        {data.mode === "overview" ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[9px] text-ink-faint">
              <span className="uppercase tracking-[0.08em]">Chromosomes</span>
              <span>click a band to select</span>
            </div>
            <div
              className="mt-1 flex gap-[2px] overflow-hidden"
              style={{ paddingLeft: LABEL_WIDTH, paddingRight: 22 }}
            >
              {data.chromosomes
                .filter((entry) => entry.chr !== "alt")
                .map((entry) => {
                  const span = Math.max(1, entry.last_pos - entry.first_pos);
                  const active = selected === entry.chr;
                  return (
                    <button
                      key={`band-${entry.chr}`}
                      type="button"
                      onClick={() => selectChromosome(entry.chr)}
                      title={`${entry.chr} · ${entry.n_cpgs.toLocaleString("en-US")} CpGs`}
                      style={{
                        flexGrow: span,
                        flexBasis: 0,
                        minWidth: entry.chr === "Y" ? 16 : 0,
                      }}
                      className={`h-5 min-w-0 overflow-hidden border text-[6.5px] transition-colors ${
                        active
                          ? "border-[#D9772A] bg-[#D9772A] text-white"
                          : "border-[#D5E2F1] bg-[#EDF3FA] text-[#627893] hover:border-[#8FB2D1] hover:bg-[#E2EDF8]"
                      }`}
                    >
                      {entry.chr.replace(/^chr/, "")}
                    </button>
                  );
                })}
            </div>
          </div>
        ) : null}

        <div ref={wrapRef} className="relative mt-1 w-full overflow-x-hidden">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
            onClick={handleClick}
            className="block cursor-crosshair"
            role="img"
            aria-label="Genome-wide predicted methylation heatmap across organ systems"
          />
          {hover ? (
            <div
              className="pointer-events-none absolute z-10 max-w-[240px] border border-line bg-white px-2 py-1 text-[10px] shadow-panel"
              style={{ left: Math.min(hover.x + 12, 850), top: Math.max(0, hover.y - 38) }}
            >
              <p className="mono font-medium text-ink">{hover.title}</p>
              <p className="text-ink-faint">{hover.detail}</p>
              <p className="tabular mt-0.5 text-primary">
                β {hover.value.toFixed(3)} · Δ {hover.delta >= 0 ? "+" : ""}
                {hover.delta.toFixed(3)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ink-faint">
          <span className="inline-flex overflow-hidden border border-line">
            {[
              { id: "deviation" as const, label: "Organ deviation" },
              { id: "beta" as const, label: "Absolute β" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setScaleMode(option.id)}
                className={`px-2 py-1 text-[9px] ${
                  scaleMode === option.id
                    ? "bg-ink text-white"
                    : "bg-white text-ink-faint hover:text-ink-soft"
                }`}
              >
                {option.label}
              </button>
            ))}
          </span>
          {scaleMode === "deviation" ? (
            <>
              <span>lower</span>
              <span
                className="h-2 w-28"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(33,102,172), rgb(247,249,252), rgb(178,24,43))",
                }}
              />
              <span>higher</span>
            </>
          ) : (
            <>
              <span>0</span>
              <span
                className="h-2 w-28"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(234,242,245), rgb(21,110,134), rgb(163,106,31))",
                }}
              />
              <span>1 predicted β</span>
            </>
          )}
          {loading ? (
            <span className="ml-auto inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              updating
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-px border border-line bg-line text-[10px] sm:grid-cols-3">
          <div className="bg-white px-3 py-2.5">
            <p className="uppercase text-ink-faint">Region</p>
            <p className="mt-1 text-[12px] font-medium text-ink">
              {selected === "all" ? "Whole genome" : selected}
              {data.mode === "window" && data.focus ? ` · ${data.focus}` : ""}
              {regionMb ? ` · ${regionMb} Mb` : ""}
            </p>
          </div>
          <div className="bg-white px-3 py-2.5">
            <p className="uppercase text-ink-faint">CpGs in view</p>
            <p className="tabular mt-1 text-[12px] font-medium text-ink">
              {regionCpGs.toLocaleString("en-US")}
            </p>
          </div>
          <div className="bg-white px-3 py-2.5">
            <p className="uppercase text-ink-faint">Top organ signal</p>
            <p className="mt-1 truncate text-[12px] font-medium text-ink">
              {topOrgan ? prettyLabel(topOrgan.label) : "—"}
              {topOrgan ? (
                <span className="ml-1 text-[#B2182B]">
                  {topOrgan.delta >= 0 ? "+" : ""}
                  {topOrgan.delta.toFixed(3)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[9px] leading-relaxed text-ink-faint">
          Predicted β, not measured methylation. “Organ deviation” subtracts
          the 16-organ mean at each CpG block; switch to absolute β for the raw
          scale.
        </p>
      </section>
    </div>
  );
}
