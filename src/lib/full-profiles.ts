import celltypeMeta from "@/data/pilot/full/celltype_meta.json";
import organMeta from "@/data/pilot/full/organ_meta.json";
import tissueMeta from "@/data/pilot/full/tissue_meta.json";

export type FullLevel = "celltype" | "tissue" | "organ";

export type FullGroup = {
  group_index: number;
  group_label: string;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
};

type MetaFile = {
  level: FullLevel;
  n_groups: number;
  n_cpgs: number;
  scale: number;
  sha256: string;
  groups: FullGroup[];
};

const META: Record<FullLevel, MetaFile> = {
  celltype: celltypeMeta as unknown as MetaFile,
  tissue: tissueMeta as unknown as MetaFile,
  organ: organMeta as unknown as MetaFile,
};

const FILES: Record<FullLevel, string> = {
  celltype: "celltype_mean_u8.bin",
  tissue: "tissue_mean_u8.bin",
  organ: "organ_mean_u8.bin",
};

const BASE_URL = (
  process.env.PILOT_PROFILE_BASE_URL ??
  "https://github.com/2586892915/cpgmoe-atlas-web/releases/download/pilot-full450k-v1"
).replace(/\/$/, "");

export const FULL_LEVELS: { id: FullLevel; label: string; n_groups: number }[] = [
  { id: "celltype", label: "Cell types", n_groups: META.celltype.n_groups },
  { id: "tissue", label: "Tissues", n_groups: META.tissue.n_groups },
  { id: "organ", label: "Organs", n_groups: META.organ.n_groups },
];

export function fullGroups(level: FullLevel): FullGroup[] {
  return META[level].groups;
}

export function fullMeta(level: FullLevel) {
  const { groups: _groups, ...rest } = META[level];
  return rest;
}

const cache = new Map<string, number[]>();
const CACHE_LIMIT = 512;

export async function readFullRecord(
  level: FullLevel,
  cpgIndex: number,
): Promise<number[] | null> {
  const meta = META[level];
  if (!Number.isInteger(cpgIndex) || cpgIndex < 0 || cpgIndex >= meta.n_cpgs) {
    return null;
  }
  const key = `${level}:${cpgIndex}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const n = meta.n_groups;
  const offset = cpgIndex * n;
  const response = await fetch(`${BASE_URL}/${FILES[level]}`, {
    headers: { Range: `bytes=${offset}-${offset + n - 1}` },
    cache: "no-store",
  });
  if (response.status !== 206) {
    throw new Error(`profile range request failed (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== n) {
    throw new Error(`short profile read (${buffer.length} of ${n})`);
  }
  const values = Array.from(buffer, (byte) => byte / meta.scale);
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, values);
  return values;
}
