import { describe, expect, it } from "vitest";
import { GET as getStatus } from "@/app/api/v1/status/route";
import { GET as getDatasets } from "@/app/api/v1/datasets/route";
import { GET as getDataset } from "@/app/api/v1/datasets/[id]/route";
import { GET as getCpgs } from "@/app/api/v1/cpgs/route";
import { GET as getGroups } from "@/app/api/v1/groups/route";
import { GET as getModels } from "@/app/api/v1/models/route";
import { GET as getSchema } from "@/app/api/v1/schema/route";
import { POST as postPredictions } from "@/app/api/v1/preview/predictions/route";
import { POST as postCompare } from "@/app/api/v1/preview/compare/route";

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("API routes", () => {
  it("GET /status returns a demo envelope with null coverage", async () => {
    const response = await getStatus();
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Data-Mode")).toBe("synthetic_demo");
    const body = await json(response);
    expect(body.data_mode).toBe("synthetic_demo");
    expect((body.coverage as Record<string, unknown>).indexed_cells).toBeNull();
  });

  it("GET /datasets paginates", async () => {
    const response = await getDatasets(
      new Request("http://localhost/api/v1/datasets?limit=3"),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    expect((body.items as unknown[]).length).toBe(3);
    expect(body.total).toBe(12);
    expect(body.next_cursor).toBeTypeOf("string");
  });

  it("GET /datasets/[id] returns 404 for an unknown id", async () => {
    const missing = await getDataset(new Request("http://localhost/api/v1/datasets/X"), {
      params: Promise.resolve({ id: "DEMO_MISSING" }),
    });
    expect(missing.status).toBe(404);
    const body = await json(missing);
    expect((body.error as Record<string, unknown>).code).toBe("dataset_not_found");

    const found = await getDataset(
      new Request("http://localhost/api/v1/datasets/DEMO_LUNG_ADENO_01"),
      { params: Promise.resolve({ id: "DEMO_LUNG_ADENO_01" }) },
    );
    expect(found.status).toBe(200);
    expect((await json(found)).data_mode).toBe("synthetic_demo");
  });

  it("GET /cpgs resolves TP53 and returns an empty state for unknown input", async () => {
    const tp53 = await getCpgs(
      new Request("http://localhost/api/v1/cpgs?query=TP53&assembly=GRCh38"),
    );
    const body = await json(tp53);
    expect((body.items as unknown[]).length).toBe(2);

    const unknown = await getCpgs(
      new Request("http://localhost/api/v1/cpgs?query=NOPE1&assembly=GRCh38"),
    );
    expect(((await json(unknown)).items as unknown[]).length).toBe(0);
  });

  it("GET /groups returns synthetic group summaries", async () => {
    const response = await getGroups(
      new Request(
        "http://localhost/api/v1/groups?dataset_id=DEMO_LUNG_ADENO_01&cpg_id=cgDEMO0001",
      ),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    expect((body.items as unknown[]).length).toBeGreaterThan(0);
    expect(body.cpg_id).toBe("cgDEMO0001");
  });

  it("GET /models and /schema expose contract metadata", async () => {
    const models = await getModels();
    expect((await json(models)).data_mode).toBe("synthetic_demo");
    const schema = await getSchema();
    const schemaBody = await json(schema);
    expect(schemaBody.coordinate_convention).toMatchObject({
      internal: "0-based half-open",
      ui: "1-based inclusive",
    });
  });

  it("POST /preview/predictions validates input and marks responses synthetic", async () => {
    const response = await postPredictions(
      new Request("http://localhost/api/v1/preview/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: "DEMO_LUNG_ADENO_01",
          cpg_ids: ["cgDEMO0001"],
          cell_ids: ["DEMO_LUNG_ADENO_01_C001"],
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.checkpoint_loaded).toBe(false);
    expect(body.is_synthetic_demo).toBe(true);

    const invalid = await postPredictions(
      new Request("http://localhost/api/v1/preview/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: "DEMO_LUNG_ADENO_01", cpg_ids: [] }),
      }),
    );
    expect(invalid.status).toBe(400);
    expect(((await json(invalid)).error as Record<string, unknown>).code).toBe(
      "invalid_request",
    );
  });

  it("POST /preview/compare returns deltas with tests unavailable", async () => {
    const response = await postCompare(
      new Request("http://localhost/api/v1/preview/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_a: { dimension: "dataset", value: "DEMO_LUNG_NORMAL_02" },
          group_b: { dimension: "dataset", value: "DEMO_LUNG_ADENO_01" },
          cpg_ids: ["cgDEMO0001"],
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.statistical_tests).toBe("unavailable_in_demo");
    expect(body.deltas).toHaveLength(1);
  });

  it("rejects unsupported assemblies", async () => {
    const response = await getCpgs(
      new Request("http://localhost/api/v1/cpgs?query=TP53&assembly=GRCh37"),
    );
    expect(response.status).toBe(400);
  });
});
