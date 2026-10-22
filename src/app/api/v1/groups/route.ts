import { getAtlasDataProvider } from "@/lib/atlas-provider";
import { handleApiError, jsonResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const provider = getAtlasDataProvider();
    return jsonResponse(
      await provider.listGroups({
        dataset_id: searchParams.get("dataset_id") ?? undefined,
        tissue: searchParams.get("tissue") ?? undefined,
        cell_type: searchParams.get("cell_type") ?? undefined,
        cpg_id: searchParams.get("cpg_id") ?? undefined,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
