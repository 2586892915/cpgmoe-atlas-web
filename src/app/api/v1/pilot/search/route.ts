import { pilotError, pilotResponse } from "@/lib/api";
import { pilotEnvelope, searchPilot } from "@/lib/pilot";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const rawLimit = Number(searchParams.get("limit") ?? "40");
  if (!Number.isFinite(rawLimit) || rawLimit < 1) {
    return pilotError("invalid_limit", "limit must be a positive integer.", 400);
  }
  const limit = Math.min(Math.floor(rawLimit), 100);
  const result = searchPilot(query, limit);
  return pilotResponse({ ...pilotEnvelope(), ...result });
}
