import cpgData from "@/data/pilot/cpgs.json";
import statsData from "@/data/pilot/cpg_stats.json";
import groupData from "@/data/pilot/groups.json";
import heatmapData from "@/data/pilot/heatmap.json";
import profileData from "@/data/pilot/profile.json";
import releaseData from "@/data/pilot/release.json";

export const PILOT_RELEASE_ID = releaseData.release_id;
export const PILOT_DATA_MODE = "pilot_predicted" as const;

export type PilotGroup = {
  group_id: number;
  group_key: string;
  tissue: string;
  cell_type: string;
  organ_system: string;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
  high_confidence: boolean;
};

export type PilotCpg = {
  cpg_id: string;
  panel_slot: number;
  chr: string | null;
  pos: number | null;
  genome_build: "GRCh38";
  panel_index: number | null;
  context: string | null;
  island_relation: string | null;
  island_locus: string | null;
  promoter: string | null;
  genes: string | null;
  gene_groups: string | null;
  total_variance: number;
};

export type PilotCpgStat = {
  cpg_id: string;
  mean: number;
  sd: number;
  min: number;
  p10: number;
  median: number;
  p90: number;
  max: number;
  n_groups: number;
  histogram: number[];
};

type ProfileFile = {
  scale: number;
  cpg_ids: string[];
  group_ids: number[];
  values: number[][];
};
type HeatmapFile = {
  cpg_ids: string[];
  organ_systems: { label: string; n_groups: number; n_cells: number; values: number[] }[];
  top_groups: { group_id: number; label: string; n_cells: number; values: number[] }[];
};

export const pilotRelease = releaseData;
const groups = groupData as unknown as PilotGroup[];
const cpgs = cpgData as unknown as PilotCpg[];
const stats = statsData as unknown as PilotCpgStat[];
const profile = profileData as unknown as ProfileFile;
const heatmap = heatmapData as unknown as HeatmapFile;

const groupById = new Map(groups.map((group) => [group.group_id, group]));
const cpgById = new Map(cpgs.map((cpg) => [cpg.cpg_id, cpg]));
const statById = new Map(stats.map((stat) => [stat.cpg_id, stat]));
const columnByCpg = new Map(profile.cpg_ids.map((id, index) => [id, index]));
const rowByGroup = new Map(profile.group_ids.map((id, index) => [id, index]));

const geneIndex = new Map<string, PilotCpg[]>();
for (const cpg of cpgs) {
  if (!cpg.genes) continue;
  const tokens = new Set(
    cpg.genes
      .split(";")
      .map((token) => token.trim().toUpperCase())
      .filter(Boolean),
  );
  for (const gene of tokens) {
    const list = geneIndex.get(gene) ?? [];
    list.push(cpg);
    geneIndex.set(gene, list);
  }
}

export function pilotEnvelope() {
  return {
    data_mode: PILOT_DATA_MODE,
    release_id: releaseData.release_id,
    prediction_type: releaseData.prediction_type,
    provenance_status: releaseData.provenance_status,
    counts_qualification: {
      cells: "3M-cell Full-S3 pilot; 2.93M cells fall inside the 2,093 profiled groups",
      profiled_cpgs: `${releaseData.n_profiled_cpgs} of ${releaseData.n_panel_probes} panel probes`,
      aggregation: releaseData.aggregation,
    },
  };
}

export function listGroups(): PilotGroup[] {
  return groups;
}

export function getGroup(id: number): PilotGroup | null {
  return groupById.get(id) ?? null;
}

export function getCpg(id: string): PilotCpg | null {
  return cpgById.get(id) ?? null;
}

export function getCpgStats(id: string): PilotCpgStat | null {
  return statById.get(id) ?? null;
}

export function groupBeta(cpgId: string, groupId: number): number | null {
  const column = columnByCpg.get(cpgId);
  const row = rowByGroup.get(groupId);
  if (column === undefined || row === undefined) return null;
  return profile.values[row][column] / profile.scale;
}

export type CpgGroupValue = {
  group: PilotGroup;
  beta: number;
  delta: number;
};

export function cpgGroupValues(
  cpgId: string,
  options: { highConfidenceOnly?: boolean } = {},
): CpgGroupValue[] {
  const column = columnByCpg.get(cpgId);
  if (column === undefined) return [];
  const reference = statById.get(cpgId)?.mean ?? 0;
  const out: CpgGroupValue[] = [];
  for (let row = 0; row < profile.values.length; row += 1) {
    const group = groupById.get(profile.group_ids[row]);
    if (!group) continue;
    if (options.highConfidenceOnly && !group.high_confidence) continue;
    const beta = profile.values[row][column] / profile.scale;
    out.push({ group, beta, delta: beta - reference });
  }
  return out;
}

export function topGroupsForCpg(cpgId: string, limit = 12) {
  return cpgGroupValues(cpgId, { highConfidenceOnly: true })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export function topCpgsForGroup(groupId: number, limit = 20) {
  const row = rowByGroup.get(groupId);
  if (row === undefined) return [];
  const values = profile.values[row];
  return profile.cpg_ids
    .map((cpgId, column) => {
      const cpg = cpgById.get(cpgId);
      const stat = statById.get(cpgId);
      const beta = values[column] / profile.scale;
      return {
        cpg_id: cpgId,
        genes: cpg?.genes ?? null,
        chr: cpg?.chr ?? null,
        pos: cpg?.pos ?? null,
        beta,
        reference: stat?.mean ?? 0,
        delta: beta - (stat?.mean ?? 0),
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

type SearchType = "gene" | "probe" | "region" | "group" | "unknown" | "empty";
const REGION_PATTERN = /^(chr[\dXYM]+):([\d,]+)-([\d,]+)$/i;

export type PilotSearchResult = {
  query: string;
  query_type: SearchType;
  cpgs: PilotCpg[];
  groups: PilotGroup[];
  gene: { symbol: string; cpg_count: number } | null;
  region: { chr: string; start: number; end: number } | null;
  truncated: boolean;
};

export function searchPilot(rawQuery: string, limit = 40): PilotSearchResult {
  const query = rawQuery.trim();
  const base: PilotSearchResult = {
    query,
    query_type: "empty",
    cpgs: [],
    groups: [],
    gene: null,
    region: null,
    truncated: false,
  };
  if (!query) return base;

  const lowered = query.toLowerCase();
  const groupHits = groups.filter((group) =>
    `${group.cell_type} ${group.tissue} ${group.organ_system}`
      .toLowerCase()
      .includes(lowered),
  );

  if (lowered.startsWith("cg")) {
    const cpg = cpgById.get(lowered);
    return {
      ...base,
      query_type: cpg ? "probe" : "unknown",
      cpgs: cpg ? [cpg] : [],
      groups: groupHits.slice(0, 8),
    };
  }

  const regionMatch = query.match(REGION_PATTERN);
  if (regionMatch) {
    const chr = regionMatch[1].toLowerCase();
    const start = Number(regionMatch[2].replace(/,/g, ""));
    const end = Number(regionMatch[3].replace(/,/g, ""));
    const hits = cpgs.filter(
      (cpg) =>
        cpg.chr?.toLowerCase() === chr &&
        cpg.pos !== null &&
        cpg.pos >= start &&
        cpg.pos <= end,
    );
    return {
      ...base,
      query_type: "region",
      region: { chr, start, end },
      cpgs: hits.slice(0, limit),
      truncated: hits.length > limit,
      groups: groupHits.slice(0, 8),
    };
  }

  const symbol = query.toUpperCase();
  const exact = geneIndex.get(symbol) ?? [];
  if (exact.length > 0) {
    return {
      ...base,
      query_type: "gene",
      cpgs: exact.slice(0, limit),
      truncated: exact.length > limit,
      gene: { symbol, cpg_count: exact.length },
      groups: groupHits.slice(0, 8),
    };
  }

  const tokenMatches = cpgs.filter((cpg) =>
    cpg.genes?.toUpperCase().includes(symbol),
  );
  if (tokenMatches.length > 0) {
    return {
      ...base,
      query_type: "gene",
      cpgs: tokenMatches.slice(0, limit),
      truncated: tokenMatches.length > limit,
      gene: { symbol, cpg_count: tokenMatches.length },
      groups: groupHits.slice(0, 8),
    };
  }

  if (groupHits.length > 0) {
    return { ...base, query_type: "group", groups: groupHits.slice(0, limit) };
  }

  return { ...base, query_type: "unknown" };
}

export function listGenes(limit = 160) {
  return [...geneIndex.entries()]
    .map(([symbol, items]) => ({ symbol, cpg_count: items.length }))
    .sort((a, b) => b.cpg_count - a.cpg_count || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}

export function compareGroups(a: number, b: number, cpgIds: string[]) {
  const rowA = rowByGroup.get(a);
  const rowB = rowByGroup.get(b);
  if (rowA === undefined || rowB === undefined) return null;
  return cpgIds
    .map((cpgId) => {
      const column = columnByCpg.get(cpgId);
      const cpg = cpgById.get(cpgId);
      if (column === undefined || !cpg) return null;
      const betaA = profile.values[rowA][column] / profile.scale;
      const betaB = profile.values[rowB][column] / profile.scale;
      return {
        cpg_id: cpgId,
        genes: cpg.genes,
        chr: cpg.chr,
        pos: cpg.pos,
        mean_beta_a: betaA,
        mean_beta_b: betaB,
        delta_beta: betaA - betaB,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((x, y) => Math.abs(y.delta_beta) - Math.abs(x.delta_beta));
}

export function highVarianceCpgs(limit = 24): PilotCpg[] {
  return [...cpgs]
    .sort((a, b) => b.total_variance - a.total_variance)
    .slice(0, limit);
}

export function pilotHeatmap() {
  return heatmap;
}

export type PilotTissue = {
  tissue: string;
  organ_system: string;
  n_groups: number;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
  cell_types: string[];
};

let tissueCache: PilotTissue[] | null = null;

export function listTissues(): PilotTissue[] {
  if (tissueCache) return tissueCache;
  const map = new Map<string, PilotTissue>();
  for (const group of groups) {
    const entry =
      map.get(group.tissue) ??
      ({
        tissue: group.tissue,
        organ_system: group.organ_system,
        n_groups: 0,
        n_cells: 0,
        n_donors: 0,
        n_datasets: 0,
        cell_types: [],
      } satisfies PilotTissue);
    entry.n_groups += 1;
    entry.n_cells += group.n_cells;
    entry.n_donors = Math.max(entry.n_donors, group.n_donors);
    entry.n_datasets = Math.max(entry.n_datasets, group.n_datasets);
    if (!entry.cell_types.includes(group.cell_type)) {
      entry.cell_types.push(group.cell_type);
    }
    map.set(group.tissue, entry);
  }
  tissueCache = [...map.values()].sort((a, b) => b.n_cells - a.n_cells);
  return tissueCache;
}

export function getTissue(name: string): PilotTissue | null {
  return listTissues().find((tissue) => tissue.tissue === name) ?? null;
}

export function tissueGroups(name: string): PilotGroup[] {
  return groups
    .filter((group) => group.tissue === name)
    .sort((a, b) => b.n_cells - a.n_cells);
}

export function tissueCpgs(name: string, limit = 12) {
  const members = tissueGroups(name);
  if (members.length === 0) return [];
  const weights = members.map((group) => group.n_cells);
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  return profile.cpg_ids
    .map((cpgId, column) => {
      let weighted = 0;
      for (let index = 0; index < members.length; index += 1) {
        const row = rowByGroup.get(members[index].group_id);
        if (row === undefined) continue;
        weighted += profile.values[row][column] * weights[index];
      }
      const mean = weighted / total / profile.scale;
      const cpg = cpgById.get(cpgId);
      const reference = statById.get(cpgId)?.mean ?? 0;
      return {
        cpg_id: cpgId,
        genes: cpg?.genes ?? null,
        chr: cpg?.chr ?? null,
        pos: cpg?.pos ?? null,
        mean,
        delta: mean - reference,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export function pilotOverview() {
  return {
    ...pilotEnvelope(),
    caveat: releaseData.caveat,
    release: releaseData,
    n_genes: geneIndex.size,
    n_organs: heatmap.organ_systems.length,
  };
}
