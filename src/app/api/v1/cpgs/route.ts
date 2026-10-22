import { getAtlasDataProvider, ProviderError } from "@/lib/atlas-provider";
import { handleApiError, jsonResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? searchParams.get("q") ?? "";
    const assembly = searchParams.get("assembly") ?? "GRCh38";
    if (assembly !== "GRCh38") {
      throw new ProviderError(
        "unsupported_assembly",
        "Only GRCh38/hg38 is supported by this prototype.",
        400,
      );
    }
    const provider = getAtlasDataProvider();
    return jsonResponse(await provider.searchCpgs(query, "GRCh38"));
  } catch (error) {
    return handleApiError(error);
  }
}
