import { pilotError, pilotResponse } from "@/lib/api";
import {
  FULL_LEVELS,
  fullGroups,
  fullMeta,
  readFullRecord,
  type FullLevel,
} from "@/lib/full-profiles";
import { pilotEnvelope } from "@/lib/pilot";
import { getProbe } from "@/lib/probes";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const level = (searchParams.get("level") ?? "celltype") as FullLevel;
  if (!FULL_LEVELS.some((entry) => entry.id === level)) {
    return pilotError("invalid_level", "level must be celltype, tissue or organ.", 400);
  }
  const probe = getProbe(id);
  if (!probe) {
    return pilotError("cpg_not_found", "Unknown probe id.", 404);
  }

  let values: number[] | null;
  try {
    values = await readFullRecord(level, probe.panel_index);
  } catch {
    return pilotError(
      "profile_unavailable",
      "Full-panel profile store is temporarily unavailable.",
      503,
    );
  }
  if (!values) {
    return pilotError("profile_not_found", "No profile for this probe.", 404);
  }

  const groups = fullGroups(level);
  return pilotResponse({
    ...pilotEnvelope(),
    cpg_id: probe.probe_id,
    panel_index: probe.panel_index,
    level,
    meta: fullMeta(level),
    items: groups.map((group, index) => ({
      group_index: group.group_index,
      label: group.group_label,
      n_cells: group.n_cells,
      n_donors: group.n_donors,
      n_datasets: group.n_datasets,
      beta: values[index],
    })),
  });
}
