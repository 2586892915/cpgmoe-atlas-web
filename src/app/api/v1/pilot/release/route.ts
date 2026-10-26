import { pilotError, pilotResponse } from "@/lib/api";
import { pilotOverview } from "@/lib/pilot";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return pilotResponse(pilotOverview());
  } catch {
    return pilotError("pilot_unavailable", "Pilot bundle could not be read.", 503);
  }
}
