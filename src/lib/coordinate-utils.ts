/**
 * Coordinate conventions.
 *
 * Internal storage: 0-based, half-open [start, end).
 * UI display:      1-based, inclusive [start, end].
 *
 * Every conversion goes through this module so offsets are never re-derived
 * ad hoc in components.
 */

export type ZeroBasedHalfOpen = { start: number; end: number };
export type OneBasedInclusive = { start: number; end: number };

export function toDisplayRange(range: ZeroBasedHalfOpen): OneBasedInclusive {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    throw new Error("Range coordinates must be integers.");
  }
  if (range.start < 0 || range.end <= range.start) {
    throw new Error("Internal range must satisfy 0 <= start < end.");
  }
  return { start: range.start + 1, end: range.end };
}

export function toInternalRange(range: OneBasedInclusive): ZeroBasedHalfOpen {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    throw new Error("Range coordinates must be integers.");
  }
  if (range.start < 1 || range.end < range.start) {
    throw new Error("Display range must satisfy 1 <= start <= end.");
  }
  return { start: range.start - 1, end: range.end };
}

export function formatBp(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatRegion(chrom: string, range: ZeroBasedHalfOpen): string {
  const display = toDisplayRange(range);
  return `${chrom}:${formatBp(display.start)}-${formatBp(display.end)}`;
}

export type ParsedRegion = {
  chrom: string;
  internal: ZeroBasedHalfOpen;
  display: OneBasedInclusive;
};

const REGION_PATTERN =
  /^(chr(?:[1-9]|1[0-9]|2[0-2]|X|Y|MT)):([\d,]+)-([\d,]+)$/i;

export function parseRegion(input: string): ParsedRegion | null {
  const match = REGION_PATTERN.exec(input.trim().replace(/\s+/g, ""));
  if (!match) return null;
  const chrom = match[1].toLowerCase() === "chrmt" ? "chrMT" : `chr${match[1].slice(3).toUpperCase()}`;
  const start = Number(match[2].replace(/,/g, ""));
  const end = Number(match[3].replace(/,/g, ""));
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
  try {
    const internal = toInternalRange({ start, end });
    return { chrom, internal, display: { start, end } };
  } catch {
    return null;
  }
}

export type ParsedQuery =
  | { kind: "empty" }
  | { kind: "gene"; value: string }
  | { kind: "probe"; value: string }
  | { kind: "region"; region: ParsedRegion }
  | { kind: "unknown"; value: string };

const GENE_PATTERN = /^[A-Za-z][A-Za-z0-9.-]{1,19}$/;
const PROBE_PATTERN = /^cg\d{4,}$/i;

export function parseSearchQuery(raw: string): ParsedQuery {
  const value = raw.trim();
  if (!value) return { kind: "empty" };
  const region = parseRegion(value);
  if (region) return { kind: "region", region };
  if (PROBE_PATTERN.test(value)) return { kind: "probe", value: value.toLowerCase() };
  if (GENE_PATTERN.test(value)) return { kind: "gene", value: value.toUpperCase() };
  return { kind: "unknown", value };
}
