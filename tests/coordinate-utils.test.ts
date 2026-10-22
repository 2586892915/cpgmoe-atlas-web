import { describe, expect, it } from "vitest";
import {
  formatRegion,
  parseRegion,
  parseSearchQuery,
  toDisplayRange,
  toInternalRange,
} from "@/lib/coordinate-utils";

describe("coordinate conversion", () => {
  it("converts 0-based half-open to 1-based inclusive", () => {
    expect(toDisplayRange({ start: 7668400, end: 7668402 })).toEqual({
      start: 7668401,
      end: 7668402,
    });
  });

  it("converts 1-based inclusive back to 0-based half-open", () => {
    expect(toInternalRange({ start: 7668401, end: 7668402 })).toEqual({
      start: 7668400,
      end: 7668402,
    });
  });

  it("round-trips a range without drift", () => {
    const internal = { start: 100, end: 250 };
    expect(toInternalRange(toDisplayRange(internal))).toEqual(internal);
  });

  it("rejects invalid ranges", () => {
    expect(() => toDisplayRange({ start: -1, end: 10 })).toThrow();
    expect(() => toDisplayRange({ start: 10, end: 10 })).toThrow();
    expect(() => toInternalRange({ start: 0, end: 10 })).toThrow();
    expect(() => toInternalRange({ start: 9, end: 8 })).toThrow();
  });

  it("formats a region in UI convention", () => {
    expect(formatRegion("chr17", { start: 7668400, end: 7668402 })).toBe(
      "chr17:7,668,401-7,668,402",
    );
  });
});

describe("query parsing", () => {
  it("parses a region with commas", () => {
    const parsed = parseRegion("chr17:7,668,001-7,690,000");
    expect(parsed?.chrom).toBe("chr17");
    expect(parsed?.internal).toEqual({ start: 7668000, end: 7690000 });
    expect(parsed?.display).toEqual({ start: 7668001, end: 7690000 });
  });

  it("normalises contig casing", () => {
    expect(parseRegion("chrx:100-200")?.chrom).toBe("chrX");
    expect(parseRegion("chrMT:100-200")?.chrom).toBe("chrMT");
  });

  it("rejects malformed regions", () => {
    expect(parseRegion("chr17:7,690,000-7,668,001")).toBeNull();
    expect(parseRegion("chr99:1-2")).toBeNull();
    expect(parseRegion("chr17:0-10")).toBeNull();
  });

  it("classifies gene, probe, region, and unknown queries", () => {
    expect(parseSearchQuery("TP53").kind).toBe("gene");
    expect(parseSearchQuery("cg00000029").kind).toBe("probe");
    expect(parseSearchQuery("chr17:7,668,001-7,690,000").kind).toBe("region");
    expect(parseSearchQuery("   ").kind).toBe("empty");
    expect(parseSearchQuery("not a query!!").kind).toBe("unknown");
  });
});
