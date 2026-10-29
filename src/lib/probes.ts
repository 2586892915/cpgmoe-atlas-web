import cpgData from "@/data/pilot/cpgs.json";
import probeData from "@/data/pilot/probes.json";

type ProbeRow = [
  string, // probe_id
  number, // chr index
  number, // pos
  string, // genes
  number, // mean x1000
  number, // variance x100000
  number, // celltype variance fraction x1000
  number, // island index
  number, // promoter index
];

type ProbeFile = {
  n_probes: number;
  chr: string[];
  island: string[];
  promoter: string[];
  rows: ProbeRow[];
};

const data = probeData as unknown as ProbeFile;
const rows = data.rows;
const profiledById = new Map(
  (cpgData as unknown as { cpg_id: string; panel_slot: number }[]).map((cpg) => [
    cpg.cpg_id,
    cpg.panel_slot,
  ]),
);

export const PROBE_COUNT = data.n_probes;
export const PROFILED_COUNT = profiledById.size;

export type ProbeRecord = {
  probe_id: string;
  chr: string | null;
  pos: number;
  genes: string | null;
  global_mean_beta: number;
  total_variance: number;
  celltype_variance_fraction: number;
  island: string | null;
  promoter: string | null;
  profiled: boolean;
  panel_slot: number | null;
  panel_index: number;
};

function toRecord(row: ProbeRow, index: number): ProbeRecord {
  return {
    probe_id: row[0],
    chr: row[1] >= 0 ? data.chr[row[1]] : null,
    pos: row[2],
    genes: row[3] || null,
    global_mean_beta: row[4] / 1000,
    total_variance: row[5] / 100000,
    celltype_variance_fraction: row[6] / 1000,
    island: row[7] >= 0 ? data.island[row[7]] : null,
    promoter: row[8] >= 0 ? data.promoter[row[8]] : null,
    profiled: profiledById.has(row[0]),
    panel_slot: profiledById.get(row[0]) ?? null,
    panel_index: index,
  };
}

let geneIndex: Map<string, number[]> | null = null;

function geneTokens(genes: string): string[] {
  if (!genes) return [];
  return [...new Set(genes.split(";").map((token) => token.trim().toUpperCase()))].filter(
    Boolean,
  );
}

function getGeneIndex(): Map<string, number[]> {
  if (geneIndex) return geneIndex;
  const index = new Map<string, number[]>();
  for (let row = 0; row < rows.length; row += 1) {
    for (const gene of geneTokens(rows[row][3])) {
      const list = index.get(gene);
      if (list) list.push(row);
      else index.set(gene, [row]);
    }
  }
  geneIndex = index;
  return index;
}

const REGION_PATTERN = /^(chr[\dXYM]+):([\d,]+)-([\d,]+)$/i;

export type ProbeSearchResult = {
  query_type: "gene" | "probe" | "region" | "unknown" | "empty";
  items: ProbeRecord[];
  total: number;
  profiled_in_result: number;
};

export function searchProbes(rawQuery: string, limit = 40): ProbeSearchResult {
  const query = rawQuery.trim();
  const empty: ProbeSearchResult = {
    query_type: "empty",
    items: [],
    total: 0,
    profiled_in_result: 0,
  };
  if (!query) return empty;

  const finish = (
    query_type: ProbeSearchResult["query_type"],
    matches: number[],
  ): ProbeSearchResult => {
    const ranked = [...matches].sort((left, right) => {
      const leftProfiled = profiledById.has(rows[left][0]) ? 0 : 1;
      const rightProfiled = profiledById.has(rows[right][0]) ? 0 : 1;
      return leftProfiled - rightProfiled || left - right;
    });
    const items = ranked.slice(0, limit).map((index) => toRecord(rows[index], index));
    return {
      query_type,
      items,
      total: matches.length,
      profiled_in_result: items.filter((item) => item.profiled).length,
    };
  };

  if (query.toLowerCase().startsWith("cg")) {
    const target = query.toLowerCase();
    const found: number[] = [];
    for (let row = 0; row < rows.length; row += 1) {
      if (rows[row][0] === target) {
        found.push(row);
        break;
      }
    }
    return finish(found.length ? "probe" : "unknown", found);
  }

  const region = query.match(REGION_PATTERN);
  if (region) {
    const chr = region[1].toLowerCase();
    const start = Number(region[2].replace(/,/g, ""));
    const end = Number(region[3].replace(/,/g, ""));
    const matches: number[] = [];
    for (let row = 0; row < rows.length; row += 1) {
      const entry = rows[row];
      const entryChr = entry[1] >= 0 ? data.chr[entry[1]].toLowerCase() : "";
      if (entryChr === chr && entry[2] >= start && entry[2] <= end) {
        matches.push(row);
      }
    }
    return finish("region", matches);
  }

  const symbol = query.toUpperCase();
  const exact = getGeneIndex().get(symbol);
  if (exact?.length) return finish("gene", exact);

  const matches: number[] = [];
  for (const [gene, indices] of getGeneIndex()) {
    if (gene.includes(symbol)) matches.push(...indices);
  }
  return finish(matches.length ? "gene" : "unknown", matches);
}

export function getProbe(id: string): ProbeRecord | null {
  const target = id.toLowerCase();
  for (let row = 0; row < rows.length; row += 1) {
    if (rows[row][0] === target) return toRecord(rows[row], row);
  }
  return null;
}

export function getProbeByIndex(index: number): ProbeRecord | null {
  if (!Number.isInteger(index) || index < 0 || index >= rows.length) return null;
  return toRecord(rows[index], index);
}

export type SearchCpgPayload = {
  cpg_id: string;
  chr: string | null;
  pos: number;
  genes: string | null;
  profiled: boolean;
  panel_slot: number | null;
  global_mean_beta: number;
  total_variance: number;
  celltype_variance_fraction: number;
  island_relation: string | null;
  promoter: string | null;
};

export function toSearchCpg(record: ProbeRecord): SearchCpgPayload {
  return {
    cpg_id: record.probe_id,
    chr: record.chr,
    pos: record.pos,
    genes: record.genes,
    profiled: record.profiled,
    panel_slot: record.panel_slot,
    global_mean_beta: record.global_mean_beta,
    total_variance: record.total_variance,
    celltype_variance_fraction: record.celltype_variance_fraction,
    island_relation: record.island,
    promoter: record.promoter,
  };
}
