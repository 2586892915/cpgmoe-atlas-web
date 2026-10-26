import { pilotResponse } from "@/lib/api";
import { pilotEnvelope, pilotHeatmap } from "@/lib/pilot";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const heatmap = pilotHeatmap();
  return pilotResponse({
    ...pilotEnvelope(),
    scale: 1000,
    cpg_ids: heatmap.cpg_ids,
    organ_systems: heatmap.organ_systems,
    top_groups: heatmap.top_groups,
  });
}
