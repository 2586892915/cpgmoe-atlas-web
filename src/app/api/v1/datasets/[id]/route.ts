import { getAtlasDataProvider } from "@/lib/atlas-provider";
import { handleApiError, jsonError, jsonResponse } from "@/lib/api";
import { DATA_MODE } from "@/lib/data-mode";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const provider = getAtlasDataProvider();
    const dataset = await provider.getDataset(id);
    if (!dataset) {
      return jsonError("dataset_not_found", `Unknown dataset: ${id}`, 404);
    }
    return jsonResponse({ data_mode: DATA_MODE, generated_at: new Date().toISOString(), dataset });
  } catch (error) {
    return handleApiError(error);
  }
}
