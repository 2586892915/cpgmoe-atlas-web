import { pilotError, pilotResponse } from "@/lib/api";
import { getGroup, pilotEnvelope, topCpgsForGroup } from "@/lib/pilot";

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
  return pilotResponse({
    ...pilotEnvelope(),
    group,
    top_cpgs: topCpgsForGroup(groupId, 24),
  });
}
