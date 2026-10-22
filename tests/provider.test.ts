import { describe, expect, it } from "vitest";
import { SyntheticAtlasProvider, ProviderError } from "@/lib/atlas-provider";
import { DatasetDetailSchema, CellRecordSchema } from "@/lib/schemas";
import { DEMO_DATASETS } from "@/mock/datasets";
import { DEMO_CELLS } from "@/mock/cells";

const provider = new SyntheticAtlasProvider();

describe("mock data integrity", () => {
  it("validates every demo dataset against the runtime schema", () => {
    expect(DEMO_DATASETS).toHaveLength(12);
    DEMO_DATASETS.forEach((dataset) => {
      expect(DatasetDetailSchema.parse(dataset).dataset_id).toMatch(/^DEMO_/);
    });
  });

  it("validates 360 synthetic cells with unique identifiers", () => {
    expect(DEMO_CELLS).toHaveLength(360);
    const ids = new Set(DEMO_CELLS.map((cell) => cell.cell_id));
    expect(ids.size).toBe(360);
    DEMO_CELLS.forEach((cell) => {
      expect(CellRecordSchema.parse(cell).is_synthetic_demo).toBe(true);
    });
  });
});

describe("SyntheticAtlasProvider", () => {
  it("returns an audited-null status envelope", async () => {
    const status = await provider.getStatus();
    expect(status.data_mode).toBe("synthetic_demo");
    expect(status.audit_state).toBe("in_progress");
    expect(status.coverage.indexed_cells).toBeNull();
    expect(status.coverage.predicted_cells).toBeNull();
    expect(status.model.checkpoint_hash).toBeNull();
  });

  it("paginates with an opaque cursor", async () => {
    const first = await provider.listDatasets({ limit: 5 });
    expect(first.items).toHaveLength(5);
    expect(first.total).toBe(12);
    expect(first.next_cursor).not.toBeNull();

    const second = await provider.listDatasets({
      limit: 5,
      cursor: first.next_cursor ?? undefined,
    });
    expect(second.items).toHaveLength(5);
    expect(second.items[0].dataset_id).not.toBe(first.items[0].dataset_id);
  });

  it("filters datasets by search and tissue", async () => {
    const lung = await provider.listDatasets({ tissue: ["Lung"], limit: 50 });
    expect(lung.items.every((dataset) => dataset.tissue === "Lung")).toBe(true);

    const searched = await provider.listDatasets({ search: "glioblastoma", limit: 50 });
    expect(searched.items).toHaveLength(1);
    expect(searched.items[0].dataset_id).toBe("DEMO_BRAIN_GBM_04");
  });

  it("gets a dataset and returns null for an unknown id", async () => {
    const dataset = await provider.getDataset("DEMO_LUNG_ADENO_01");
    expect(dataset?.tissue).toBe("Lung");
    expect(await provider.getDataset("DEMO_NOPE")).toBeNull();
  });

  it("resolves a gene query to demo CpGs", async () => {
    const result = await provider.searchCpgs("TP53", "GRCh38");
    expect(result.query_type).toBe("gene");
    expect(result.gene?.gene_symbol).toBe("TP53");
    expect(result.items.map((item) => item.cpg_id)).toEqual([
      "cgDEMO0001",
      "cgDEMO0002",
    ]);
    expect(result.empty_reason).toBeNull();
  });

  it("does not fabricate coordinates for a withheld probe", async () => {
    const result = await provider.searchCpgs("cg00000029", "GRCh38");
    expect(result.query_type).toBe("probe");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].annotation_status).toBe("annotation_withheld");
    expect(result.items[0].chrom).toBeNull();
    expect(result.items[0].start).toBeNull();
    expect(result.empty_reason).toContain("withheld");
  });

  it("returns an explicit empty state for an unknown gene", async () => {
    const result = await provider.searchCpgs("NOPE1", "GRCh38");
    expect(result.items).toHaveLength(0);
    expect(result.empty_reason).toContain("No demo gene record");
  });

  it("finds demo CpGs inside an internal half-open region", async () => {
    const result = await provider.searchCpgs(
      "chr17:7,668,001-7,690,000",
      "GRCh38",
    );
    expect(result.query_type).toBe("region");
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.every((item) => item.chrom === "chr17")).toBe(true);
  });

  it("produces a synthetic prediction preview without a checkpoint", async () => {
    const preview = await provider.previewPredictions({
      dataset_id: "DEMO_LUNG_ADENO_01",
      cpg_ids: ["cgDEMO0001"],
      cell_ids: ["DEMO_LUNG_ADENO_01_C001"],
    });
    expect(preview.checkpoint_loaded).toBe(false);
    expect(preview.is_synthetic_demo).toBe(true);
    expect(preview.predictions).toHaveLength(1);
    expect(preview.predictions[0].is_synthetic_demo).toBe(true);
    expect(preview.predictions[0].predicted_beta).toBeGreaterThanOrEqual(0);
    expect(preview.predictions[0].predicted_beta).toBeLessThanOrEqual(1);
  });

  it("blocks prediction previews for excluded datasets", async () => {
    await expect(
      provider.previewPredictions({
        dataset_id: "DEMO_PANCREAS_09",
        cpg_ids: ["cgDEMO0001"],
      }),
    ).rejects.toMatchObject({ code: "dataset_excluded" });
  });

  it("returns deltas but no inferential test", async () => {
    const comparison = await provider.previewCompare({
      group_a: { dimension: "dataset", value: "DEMO_LUNG_NORMAL_02" },
      group_b: { dimension: "dataset", value: "DEMO_LUNG_ADENO_01" },
      cpg_ids: ["cgDEMO0001", "cgDEMO0002"],
    });
    expect(comparison.statistical_tests).toBe("unavailable_in_demo");
    expect(comparison.deltas).toHaveLength(2);
    expect(comparison.group_a.n_cells).toBeGreaterThan(0);
    expect(comparison.group_b.n_cells).toBeGreaterThan(0);
  });

  it("rejects unsupported genome assemblies", async () => {
    await expect(provider.searchCpgs("TP53", "GRCh37" as "GRCh38")).rejects.toBeInstanceOf(
      ProviderError,
    );
  });
});
