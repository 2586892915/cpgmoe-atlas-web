import { describe, expect, it } from "vitest";
import { GET as getRelease } from "@/app/api/v1/pilot/release/route";
import { GET as getCpg } from "@/app/api/v1/pilot/cpgs/[id]/route";
import { GET as getPilotSearch } from "@/app/api/v1/pilot/search/route";
import {
  compareGroups,
  cpgGroupValues,
  highVarianceCpgs,
  listGroups,
  pilotHeatmap,
  searchPilot,
} from "@/lib/pilot";

describe("pilot data layer", () => {
  it("exposes the 3M-cell pilot totals", () => {
    const groups = listGroups();
    expect(groups).toHaveLength(2093);
    expect(groups.reduce((sum, group) => sum + group.n_cells, 0)).toBe(2933703);
    expect(groups.filter((group) => group.high_confidence).length).toBeGreaterThan(500);
  });

  it("resolves a gene to real panel CpGs with hg38 coordinates", () => {
    const result = searchPilot("PTPRN2");
    expect(result.query_type).toBe("gene");
    expect(result.cpgs.length).toBeGreaterThan(0);
    expect(result.cpgs[0].chr).toMatch(/^chr/);
    expect(result.cpgs[0].pos).toBeGreaterThan(0);
  });

  it("resolves an exact probe id", () => {
    const result = searchPilot("cg26173773");
    expect(result.query_type).toBe("probe");
    expect(result.cpgs).toHaveLength(1);
    expect(result.cpgs[0].genes).toContain("PTPRN2");
  });

  it("resolves a GRCh38 interval", () => {
    const result = searchPilot("chr7:158,280,000-158,290,000");
    expect(result.query_type).toBe("region");
    expect(result.cpgs.length).toBeGreaterThan(0);
    for (const cpg of result.cpgs) {
      expect(cpg.chr).toBe("chr7");
      expect(cpg.pos).toBeGreaterThanOrEqual(158280000);
      expect(cpg.pos).toBeLessThanOrEqual(158290000);
    }
  });

  it("returns an explicit unknown state instead of inventing a probe", () => {
    const result = searchPilot("NOT_A_REAL_GENE_XYZ");
    expect(result.query_type).toBe("unknown");
    expect(result.cpgs).toHaveLength(0);
  });

  it("serves one beta value per group for a profiled CpG", () => {
    const values = cpgGroupValues("cg26173773");
    expect(values).toHaveLength(2093);
    expect(values.every((value) => value.beta >= 0 && value.beta <= 1)).toBe(true);
  });

  it("compares two groups and sorts by absolute delta", () => {
    const groups = listGroups().slice(0, 2);
    const rows = compareGroups(groups[0].group_id, groups[1].group_id, [
      "cg26173773",
      "cg16698286",
      "cg26765260",
    ]);
    expect(rows).toHaveLength(3);
    const magnitude = rows!.map((row) => Math.abs(row.delta_beta));
    expect([...magnitude].sort((a, b) => b - a)).toEqual(magnitude);
  });

  it("keeps the heatmap rows aligned with the 512-CpG panel", () => {
    const heatmap = pilotHeatmap();
    expect(heatmap.cpg_ids).toHaveLength(512);
    expect(heatmap.organ_systems.length).toBeGreaterThan(0);
    for (const row of heatmap.organ_systems) {
      expect(row.values).toHaveLength(512);
    }
    expect(highVarianceCpgs(24)).toHaveLength(24);
  });
});

describe("pilot API routes", () => {
  it("GET /api/v1/pilot/release advertises the pilot mode", async () => {
    const response = await getRelease();
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Data-Mode")).toBe("pilot_predicted");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.data_mode).toBe("pilot_predicted");
    expect(body.release_id).toBe("pilot_3m_20261024");
  });

  it("GET /api/v1/pilot/cpgs/[id] returns group values", async () => {
    const response = await getCpg(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cg26173773" }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.n_groups).toBe(2093);
    const stats = body.stats as Record<string, number | number[]>;
    expect(stats.mean as number).toBeGreaterThan(0);
    expect(stats.histogram as number[]).toHaveLength(10);
  });

  it("GET /api/v1/pilot/cpgs/[id] returns 404 for an off-panel probe", async () => {
    const response = await getCpg(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cg00000000" }),
    });
    expect(response.status).toBe(404);
  });

  it("GET /api/v1/pilot/search returns a typed result", async () => {
    const response = await getPilotSearch(
      new Request("http://localhost/api/v1/pilot/search?q=cg26173773"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.query_type).toBe("probe");
    expect((body.cpgs as unknown[]).length).toBe(1);
  });
});
