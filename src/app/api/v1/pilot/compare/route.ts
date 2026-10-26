import { z } from "zod";
import { pilotError, pilotResponse } from "@/lib/api";
import { compareGroups, getGroup, pilotEnvelope } from "@/lib/pilot";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  group_a: z.number().int(),
  group_b: z.number().int(),
  cpg_ids: z.array(z.string().min(3)).min(1).max(64),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return pilotError("invalid_json", "Request body must be JSON.", 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return pilotError(
      "invalid_request",
      "group_a, group_b and cpg_ids (1-64) are required.",
      400,
    );
  }
  const { group_a, group_b, cpg_ids } = parsed.data;
  if (group_a === group_b) {
    return pilotError("invalid_request", "Choose two different groups.", 400);
  }
  const a = getGroup(group_a);
  const b = getGroup(group_b);
  if (!a || !b) {
    return pilotError("group_not_found", "Unknown group id.", 404);
  }
  const items = compareGroups(group_a, group_b, cpg_ids);
  if (!items) {
    return pilotError("invalid_request", "Comparison could not be computed.", 400);
  }
  return pilotResponse({
    ...pilotEnvelope(),
    group_a: {
      group_id: a.group_id,
      label: `${a.tissue} · ${a.cell_type}`,
      n_cells: a.n_cells,
      n_donors: a.n_donors,
      n_datasets: a.n_datasets,
    },
    group_b: {
      group_id: b.group_id,
      label: `${b.tissue} · ${b.cell_type}`,
      n_cells: b.n_cells,
      n_donors: b.n_donors,
      n_datasets: b.n_datasets,
    },
    items,
    statistical_tests: "unavailable",
    statistical_note:
      "Groups are not independent biological replicates and study coverage differs; no p-values are computed.",
  });
}
