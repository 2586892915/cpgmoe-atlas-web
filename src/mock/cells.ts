import type { CellRecord } from "@/lib/schemas";
import { DEMO_DATASETS } from "@/mock/datasets";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function buildCells(): CellRecord[] {
  const cells: CellRecord[] = [];
  const cellsPerDataset = 30;

  DEMO_DATASETS.forEach((dataset, datasetIndex) => {
    const rng = mulberry32(20261022 + datasetIndex * 977);
    const datasetAngle = (datasetIndex / DEMO_DATASETS.length) * Math.PI * 2;
    const centreX = 50 + Math.cos(datasetAngle) * 25;
    const centreY = 50 + Math.sin(datasetAngle) * 23;
    const types = dataset.cell_types;

    for (let i = 0; i < cellsPerDataset; i += 1) {
      const typeIndex = i % types.length;
      const cellType = types[typeIndex];
      const typeAngle = (typeIndex / types.length) * Math.PI * 2 + datasetIndex * 0.31;
      const radial = 3.5 + rng() * 5.2;
      const jitterX = (rng() - 0.5) * 3.4;
      const jitterY = (rng() - 0.5) * 3.4;
      const x = clamp(centreX + Math.cos(typeAngle) * radial + jitterX, 2, 98);
      const y = clamp(centreY + Math.sin(typeAngle) * radial + jitterY, 2, 98);

      const typeBase = 0.24 + ((typeIndex * 0.097 + datasetIndex * 0.017) % 0.46);
      const noise = (rng() - 0.5) * 0.13;
      const beta = clamp(typeBase + noise, 0.04, 0.96);

      const cellId = `${dataset.dataset_id}_C${String(i + 1).padStart(3, "0")}`;
      cells.push({
        cell_id: cellId,
        dataset_id: dataset.dataset_id,
        cell_type: cellType,
        tissue: dataset.tissue ?? "Unknown",
        disease: dataset.disease ?? "Unknown",
        x: round(x, 2),
        y: round(y, 2),
        predicted_beta_demo: round(beta, 3),
        is_synthetic_demo: true,
      });
    }
  });

  return cells;
}

export const DEMO_CELLS: CellRecord[] = buildCells();

export const CELL_BY_ID = new Map(DEMO_CELLS.map((cell) => [cell.cell_id, cell]));

export const CELLS_BY_DATASET = DEMO_CELLS.reduce<Record<string, CellRecord[]>>(
  (acc, cell) => {
    (acc[cell.dataset_id] ??= []).push(cell);
    return acc;
  },
  {},
);

export const UNIQUE_CELL_TYPES = Array.from(
  new Set(DEMO_CELLS.map((cell) => cell.cell_type)),
).sort();

export function syntheticBetaForCellAndCpg(cellId: string, cpgId: string): number {
  const base = CELL_BY_ID.get(cellId)?.predicted_beta_demo ?? 0.5;
  const offset = ((hashString(`${cellId}:${cpgId}`) % 2001) / 2000 - 0.5) * 0.22;
  return round(clamp(base + offset, 0.02, 0.98), 3);
}
