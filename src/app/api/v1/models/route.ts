import { getAtlasDataProvider } from "@/lib/atlas-provider";
import { handleApiError, jsonResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const provider = getAtlasDataProvider();
    return jsonResponse(await provider.getModels());
  } catch (error) {
    return handleApiError(error);
  }
}
