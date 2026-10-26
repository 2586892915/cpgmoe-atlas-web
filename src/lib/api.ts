import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ProviderError } from "@/lib/atlas-provider";
import { DATA_MODE } from "@/lib/data-mode";
import { PILOT_RELEASE_ID } from "@/lib/pilot";

const DEMO_HEADERS = {
  "Cache-Control": "no-store",
  "X-Data-Mode": DATA_MODE,
};

export function jsonResponse(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, { status, headers: DEMO_HEADERS });
}

const PILOT_HEADERS = {
  "Cache-Control": "no-store",
  "X-Data-Mode": "pilot_predicted",
  "X-Release-Id": PILOT_RELEASE_ID,
};

export function pilotResponse(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, { status, headers: PILOT_HEADERS });
}

export function pilotError(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return pilotResponse(
    {
      data_mode: "pilot_predicted",
      release_id: PILOT_RELEASE_ID,
      error: { code, message },
    },
    status,
  );
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return jsonResponse(
    {
      data_mode: DATA_MODE,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    status,
  );
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ProviderError) {
    return jsonError(error.code, error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(
      "invalid_request",
      "Request validation failed.",
      400,
      error.flatten(),
    );
  }
  console.error("Unhandled API error", error);
  return jsonError(
    "internal_error",
    "The request could not be completed. This demo does not call a model backend.",
    500,
  );
}

export function parseLimit(value: string | null, fallback = 10): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new ProviderError(
      "invalid_limit",
      "limit must be a positive integer.",
      400,
    );
  }
  return Math.min(Math.floor(parsed), 50);
}
