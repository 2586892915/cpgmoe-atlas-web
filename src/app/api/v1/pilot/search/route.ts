import { pilotError, pilotResponse } from "@/lib/api";
import { pilotEnvelope, searchPilot } from "@/lib/pilot";
import {
  PROFILED_COUNT,
  PROBE_COUNT,
  searchProbes,
  toSearchCpg,
} from "@/lib/probes";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const rawLimit = Number(searchParams.get("limit") ?? "40");
  if (!Number.isFinite(rawLimit) || rawLimit < 1) {
    return pilotError("invalid_limit", "limit must be a positive integer.", 400);
  }
  const limit = Math.min(Math.floor(rawLimit), 100);
  const probes = searchProbes(query, limit);
  const groups = query.trim() ? searchPilot(query).groups : [];

  const cpgs = probes.items.map(toSearchCpg);

  return pilotResponse({
    ...pilotEnvelope(),
    query,
    query_type: probes.query_type,
    cpgs,
    groups,
    gene: null,
    region: null,
    total: probes.total,
    truncated: probes.total > limit,
    coverage: {
      indexed_probes: PROBE_COUNT,
      profiled_cpgs: PROFILED_COUNT,
    },
  });
}
