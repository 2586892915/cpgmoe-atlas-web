import { pilotError, pilotResponse } from "@/lib/api";
import organMeta from "@/data/pilot/full/organ_meta.json";
import genomeMeta from "@/data/pilot/full/organ_genome_meta.json";
import atlasBins from "@/data/pilot/full/atlas_bins_b64.json";
import { pilotEnvelope } from "@/lib/pilot";
import {
  genomeOrder,
  getProbeByIndex,
  searchProbes,
  type ProbeRecord,
} from "@/lib/probes";

export const dynamic = "force-dynamic";

const BASE_URL = (
  process.env.PILOT_PROFILE_BASE_URL ??
  "https://github.com/2586892915/cpgmoe-atlas-web/releases/download/pilot-full450k-v1"
).replace(/\/$/, "");
const GENOME_FILE = "organ_genome_u8.bin";
const N_ORGANS = 16;
const N_CPGS = 485_403;
const MAX_WINDOW = 4_096;
const OVERVIEW_BINS = 512;
const CHR_BIN_SIZE = 320;
const OVERVIEW_RAW = Buffer.from(atlasBins.overview, "base64");
const CHR_RAW = Buffer.from(atlasBins.chromosomes, "base64");

type GenomeMeta = {
  n_cpgs: number;
  n_bins: number;
  bin_edges: number[];
  chr_bin_size: number;
  chromosomes: { chr: string; start: number; end: number; n: number }[];
};

type OrganMeta = {
  groups: { group_index: number; group_label: string; n_cells: number }[];
};

const META = genomeMeta as unknown as GenomeMeta;
const ORGANS = (organMeta as unknown as OrganMeta).groups;

let genomePosition: Uint32Array | null = null;

function genomePositionOf(panelIndex: number): number {
  if (!genomePosition) {
    genomePosition = new Uint32Array(N_CPGS).fill(0xffffffff);
    genomeOrder().forEach((index, position) => {
      genomePosition![index] = position;
    });
  }
  return genomePosition[panelIndex] ?? 0xffffffff;
}

function probeAt(position: number): ProbeRecord | null {
  if (position < 0 || position >= N_CPGS) return null;
  return getProbeByIndex(genomeOrder()[position]);
}

async function readRange(
  file: string,
  start: number,
  length: number,
): Promise<Buffer> {
  const response = await fetch(`${BASE_URL}/${file}`, {
    headers: { Range: `bytes=${start}-${start + length - 1}` },
    cache: "no-store",
  });
  if (response.status !== 206) {
    throw new Error(`range request failed (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== length) {
    throw new Error(`short range read (${buffer.length} of ${length})`);
  }
  return buffer;
}

function chromosomeList() {
  return META.chromosomes.map((entry) => {
    const first = probeAt(entry.start);
    const last = probeAt(entry.end - 1);
    return {
      chr: entry.chr,
      start: entry.start,
      end: entry.end,
      n_cpgs: entry.n,
      first_pos: first?.pos ?? 0,
      last_pos: last?.pos ?? 0,
    };
  });
}

function organValues(values: number[][]) {
  return ORGANS.map((organ, index) => ({
    group_index: organ.group_index,
    label: organ.group_label,
    n_cells: organ.n_cells,
    values: values[index].map((value) => Math.round(value * 1000) / 1000),
  }));
}

function aggregate(raw: Buffer, n_cpgs: number, n_bins: number) {
  const rows = new Uint8Array(raw);
  const width = Math.max(1, Math.min(n_bins, n_cpgs));
  const edges = Array.from({ length: width + 1 }, (_, index) =>
    Math.round((index * n_cpgs) / width),
  );
  const values = Array.from({ length: N_ORGANS }, () => [] as number[]);
  for (let bin = 0; bin < width; bin += 1) {
    const start = edges[bin];
    const end = edges[bin + 1];
    const count = Math.max(1, end - start);
    for (let organ = 0; organ < N_ORGANS; organ += 1) {
      let sum = 0;
      for (let index = start; index < end; index += 1) {
        sum += rows[index * N_ORGANS + organ];
      }
      values[organ].push(sum / count / 255);
    }
  }
  return { values, edges };
}

function binMetadata(
  base: number,
  edges: number[],
  label: string,
) {
  return edges.slice(0, -1).map((start, index) => {
    const end = edges[index + 1];
    const first = probeAt(base + start);
    const last = probeAt(base + Math.max(start, end - 1));
    return {
      index,
      chr: first?.chr ?? label,
      start: base + start,
      end: base + end,
      n_cpgs: end - start,
      first_pos: first?.pos ?? 0,
      last_pos: last?.pos ?? 0,
    };
  });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q");

  try {
    if (query) {
      const result = searchProbes(query, 1);
      const probe = result.items[0];
      if (!probe) {
        return pilotError("cpg_not_found", "No matching CpG or gene.", 404);
      }
      const position = genomePositionOf(probe.panel_index);
      if (position === 0xffffffff) {
        return pilotError("cpg_not_found", "CpG is not in the atlas order.", 404);
      }
      const chromosome = META.chromosomes.find((entry) => entry.chr === probe.chr);
      const lower = chromosome?.start ?? 0;
      const upper = chromosome?.end ?? N_CPGS;
      const start = Math.max(
        lower,
        Math.min(upper - Math.min(MAX_WINDOW, upper - lower), position - MAX_WINDOW / 2),
      );
      const end = Math.min(upper, start + MAX_WINDOW);
      const raw = await readRange(GENOME_FILE, start * N_ORGANS, (end - start) * N_ORGANS);
      const { values } = aggregate(raw, end - start, end - start);
      const cpgs = Array.from({ length: end - start }, (_, index) => {
        const record = probeAt(start + index);
        return {
          cpg_id: record?.probe_id ?? "",
          chr: record?.chr ?? "",
          pos: record?.pos ?? 0,
          genes: record?.genes ?? null,
        };
      });
      return pilotResponse({
        ...pilotEnvelope(),
        mode: "window",
        chromosome: probe.chr,
        n_cpgs_total: N_CPGS,
        start,
        end,
        focus: probe.probe_id,
        organs: organValues(values),
        cpgs,
        chromosomes: chromosomeList(),
      });
    }

    if (mode === "overview") {
      const raw = OVERVIEW_RAW;
      const factor = META.n_bins / OVERVIEW_BINS;
      const values = Array.from({ length: N_ORGANS }, () => [] as number[]);
      for (let bin = 0; bin < OVERVIEW_BINS; bin += 1) {
        for (let organ = 0; organ < N_ORGANS; organ += 1) {
          let sum = 0;
          for (let offset = 0; offset < factor; offset += 1) {
            sum += raw[(bin * factor + offset) * N_ORGANS + organ];
          }
          values[organ].push(sum / factor / 255);
        }
      }
      const edges = META.bin_edges.filter((_, index) => index % factor === 0);
      return pilotResponse({
        ...pilotEnvelope(),
        mode: "overview",
        chromosome: "all",
        n_cpgs_total: N_CPGS,
        start: 0,
        end: N_CPGS,
        bins: binMetadata(0, edges, "all"),
        organs: organValues(values),
        chromosomes: chromosomeList(),
      });
    }

    const startRaw = Number(searchParams.get("start"));
    const endRaw = Number(searchParams.get("end"));
    if (Number.isFinite(startRaw) && Number.isFinite(endRaw) && endRaw > startRaw) {
      const requestedChr = searchParams.get("chr");
      const chromosome = requestedChr
        ? META.chromosomes.find((entry) => entry.chr === requestedChr)
        : undefined;
      const lower = chromosome?.start ?? 0;
      const upper = chromosome?.end ?? N_CPGS;
      const start = Math.max(lower, Math.floor(startRaw));
      const end = Math.min(
        upper,
        start + Math.min(MAX_WINDOW, Math.floor(endRaw) - start),
      );
      const raw = await readRange(GENOME_FILE, start * N_ORGANS, (end - start) * N_ORGANS);
      const { values } = aggregate(raw, end - start, end - start);
      const cpgs = Array.from({ length: end - start }, (_, index) => {
        const record = probeAt(start + index);
        return {
          cpg_id: record?.probe_id ?? "",
          chr: record?.chr ?? "",
          pos: record?.pos ?? 0,
          genes: record?.genes ?? null,
        };
      });
      return pilotResponse({
        ...pilotEnvelope(),
        mode: "window",
        chromosome: cpgs[0]?.chr ?? "all",
        n_cpgs_total: N_CPGS,
        start,
        end,
        focus: searchParams.get("focus") ?? undefined,
        organs: organValues(values),
        cpgs,
        chromosomes: chromosomeList(),
      });
    }

    const chr = searchParams.get("chr") ?? "chr1";
    const chrIndex = META.chromosomes.findIndex((entry) => entry.chr === chr);
    if (chrIndex < 0) {
      return pilotError("chromosome_not_found", "Unknown chromosome.", 404);
    }
    const range = META.chromosomes[chrIndex];
    const width = Math.min(CHR_BIN_SIZE, range.n);
    const raw = CHR_RAW;
    const offset = chrIndex * CHR_BIN_SIZE * N_ORGANS;
    const values = Array.from({ length: N_ORGANS }, () => [] as number[]);
    for (let bin = 0; bin < width; bin += 1) {
      for (let organ = 0; organ < N_ORGANS; organ += 1) {
        values[organ].push(raw[offset + bin * N_ORGANS + organ] / 255);
      }
    }
    const edges = Array.from({ length: width + 1 }, (_, index) =>
      Math.round((index * range.n) / width),
    );
    return pilotResponse({
      ...pilotEnvelope(),
      mode: "chromosome",
      chromosome: chr,
      n_cpgs_total: N_CPGS,
      start: range.start,
      end: range.end,
      bins: binMetadata(range.start, edges, chr),
      organs: organValues(values),
      chromosomes: chromosomeList(),
    });
  } catch {
    return pilotError(
      "atlas_unavailable",
      "The full-panel atlas store is temporarily unavailable.",
      503,
    );
  }
}
