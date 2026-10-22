import { getAtlasDataProvider } from "@/lib/atlas-provider";
import { handleApiError, jsonResponse, parseLimit } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const provider = getAtlasDataProvider();
    const response = await provider.listDatasets({
      search: searchParams.get("search") ?? undefined,
      tissue: searchParams.getAll("tissue"),
      disease: searchParams.getAll("disease"),
      assay: searchParams.getAll("assay"),
      cursor: searchParams.get("cursor") ?? undefined,
      limit: parseLimit(searchParams.get("limit")),
    });
    return jsonResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}
