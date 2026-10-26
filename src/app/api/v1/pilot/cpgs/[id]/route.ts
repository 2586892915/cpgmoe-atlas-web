import { pilotError, pilotResponse } from "@/lib/api";
import {
  cpgGroupValues,
  getCpg,
  getCpgStats,
  pilotEnvelope,
  topGroupsForCpg,
} from "@/lib/pilot";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const cpg = getCpg(id);
  if (!cpg) {
    return pilotError("cpg_not_found", "Unknown CpG id in the pilot panel.", 404);
  }
  const stats = getCpgStats(id);
  const values = cpgGroupValues(id);
  return pilotResponse({
    ...pilotEnvelope(),
    cpg,
    stats,
    n_groups: values.length,
    high_confidence_groups: values.filter((value) => value.group.high_confidence).length,
    top_groups: topGroupsForCpg(id, 15),
    coverage_note:
      "Only the 512-CpG high-variance panel carries group-level beta in this pilot. " +
      "Other panel probes are not served by the web slice.",
  });
}
