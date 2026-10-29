import { pilotError, pilotResponse } from "@/lib/api";
import { fullTopCpgsForGroup } from "@/lib/group-top-cpgs";
import { getGroup, pilotEnvelope } from "@/lib/pilot";
import { getProbeByIndex } from "@/lib/probes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) {
    return pilotError("invalid_group", "Group id must be an integer.", 400);
  }
  const group = getGroup(groupId);
  if (!group) {
    return pilotError("group_not_found", "Unknown group id.", 404);
  }
  const topCpgs = fullTopCpgsForGroup(groupId, 24).flatMap((item) => {
    const probe = getProbeByIndex(item.panel_index);
    if (!probe) return [];
    return [
      {
        cpg_id: probe.probe_id,
        genes: probe.genes,
        chr: probe.chr,
        pos: probe.pos,
        beta: item.beta,
        reference: Math.max(0, Math.min(1, item.beta - item.delta)),
        delta: item.delta,
      },
    ];
  });
  return pilotResponse({
    ...pilotEnvelope(),
    group,
    top_cpgs: topCpgs,
  });
}
