import { getAtlasDataProvider } from "@/lib/atlas-provider";
import { handleApiError, jsonResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const provider = getAtlasDataProvider();
    return jsonResponse(await provider.previewCompare(body), 200);
  } catch (error) {
    return handleApiError(error);
  }
}
