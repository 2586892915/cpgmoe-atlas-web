import groupTopData from "@/data/pilot/full/group_top_cpgs.json";

type GroupTopFile = {
  n_groups: number;
  n_cpgs: number;
  k: number;
  groups: { group_index: number; items: [number, number, number][] }[];
};

export type GroupTopCpg = {
  panel_index: number;
  beta: number;
  delta: number;
};

const data = groupTopData as unknown as GroupTopFile;
const byGroup = new Map(
  data.groups.map((entry) => [entry.group_index, entry.items] as const),
);

export const GROUP_TOP_N_CPGS = data.n_cpgs;

export function fullTopCpgsForGroup(
  groupIndex: number,
  limit = 30,
): GroupTopCpg[] {
  const items = byGroup.get(groupIndex);
  if (!items) return [];
  return items.slice(0, limit).map(([panel_index, beta, delta]) => ({
    panel_index,
    beta,
    delta,
  }));
}
