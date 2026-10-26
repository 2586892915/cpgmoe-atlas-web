import { pilotResponse } from "@/lib/api";
import { listGroups, pilotEnvelope } from "@/lib/pilot";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const tissue = searchParams.get("tissue");
  const cellType = searchParams.get("cell_type");
  const organ = searchParams.get("organ_system");
  const highConfidence = searchParams.get("high_confidence") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "200") || 200, 2200);

  const items = listGroups()
    .filter((group) => {
      if (tissue && group.tissue !== tissue) return false;
      if (cellType && group.cell_type !== cellType) return false;
      if (organ && group.organ_system !== organ) return false;
      if (highConfidence && !group.high_confidence) return false;
      if (
        query &&
        !`${group.cell_type} ${group.tissue}`.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.n_cells - a.n_cells)
    .slice(0, limit);

  return pilotResponse({
    ...pilotEnvelope(),
    items,
    total: items.length,
    total_groups: listGroups().length,
  });
}
