import { DATA_MODE } from "@/lib/data-mode";
import {
  AtlasDatasetSchema,
  ComparePreviewResponseSchema,
  CompareRequestSchema,
  CpgSearchResponseSchema,
  DatasetDetailSchema,
  DatasetListResponseSchema,
  GroupsResponseSchema,
  ModelsResponseSchema,
  PredictionPreviewResponseSchema,
  PredictionRequestSchema,
  SchemaResponseSchema,
  StatusResponseSchema,
  type CpgSearchResponse,
  type ComparePreviewResponse,
  type DatasetDetail,
  type DatasetListResponse,
  type GroupsResponse,
  type ModelsResponse,
  type PredictionPreviewResponse,
  type SchemaResponse,
  type StatusResponse,
} from "@/lib/schemas";
import { parseSearchQuery } from "@/lib/coordinate-utils";
import { DEMO_DATASETS, getDemoDataset } from "@/mock/datasets";
import { CELL_BY_ID, CELLS_BY_DATASET, UNIQUE_CELL_TYPES } from "@/mock/cells";
import {
  CPG_BY_ID,
  DEFAULT_CPG_PANEL,
  DEMO_CPGS,
  GENE_BY_SYMBOL,
  groupMeansForCells,
  groupSummaryByCellType,
} from "@/mock/methylation";

export class ProviderError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}

export type DatasetQuery = {
  search?: string;
  tissue?: string[];
  disease?: string[];
  assay?: string[];
  cursor?: string;
  limit?: number;
};

export type GroupsQuery = {
  dataset_id?: string;
  tissue?: string;
  cell_type?: string;
  cpg_id?: string;
};

export interface AtlasDataProvider {
  getStatus(): Promise<StatusResponse>;
  listDatasets(query: DatasetQuery): Promise<DatasetListResponse>;
  getDataset(datasetId: string): Promise<DatasetDetail | null>;
  searchCpgs(query: string, assembly: "GRCh38"): Promise<CpgSearchResponse>;
  listGroups(query: GroupsQuery): Promise<GroupsResponse>;
  previewPredictions(input: unknown): Promise<PredictionPreviewResponse>;
  previewCompare(input: unknown): Promise<ComparePreviewResponse>;
  getModels(): Promise<ModelsResponse>;
  getSchema(): Promise<SchemaResponse>;
}

function now(): string {
  return new Date().toISOString();
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function asArray(value?: string[]): string[] {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function uniqueSorted(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort(
    (a, b) => a.localeCompare(b),
  );
}

function datasetSearchText(dataset: DatasetDetail): string {
  return [
    dataset.dataset_id,
    dataset.title,
    dataset.tissue,
    dataset.disease,
    dataset.assay,
    dataset.cell_types.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function resolveCompareCells(
  dimension: "dataset" | "tissue" | "cell_type",
  value: string,
) {
  return Object.values(CELLS_BY_DATASET)
    .flat()
    .filter((cell) => {
      if (dimension === "dataset") return cell.dataset_id === value;
      if (dimension === "tissue") return cell.tissue === value;
      return cell.cell_type === value;
    });
}

export class SyntheticAtlasProvider implements AtlasDataProvider {
  async getStatus(): Promise<StatusResponse> {
    return StatusResponseSchema.parse({
      data_mode: DATA_MODE,
      generated_at: now(),
      status: "prototype",
      audit_state: "in_progress",
      message:
        "The production atlas is not released. Counts below are withheld until the data audit completes.",
      catalogue: {
        synthetic_datasets: DEMO_DATASETS.length,
        production_datasets: null,
      },
      coverage: {
        indexed_cells: null,
        eligible_cells: null,
        encoded_cells: null,
        predicted_cells: null,
      },
      model: {
        model_id: "CPGMoE",
        checkpoint_hash: null,
        prediction_semantics: "predicted_beta",
      },
    });
  }

  async listDatasets(query: DatasetQuery): Promise<DatasetListResponse> {
    const search = query.search?.trim().toLowerCase();
    const tissues = asArray(query.tissue);
    const diseases = asArray(query.disease);
    const assays = asArray(query.assay);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
    const offset = decodeCursor(query.cursor);

    const filtered = DEMO_DATASETS.filter((dataset) => {
      if (search && !datasetSearchText(dataset).includes(search)) return false;
      if (tissues.length && !tissues.includes(dataset.tissue ?? "")) return false;
      if (diseases.length && !diseases.includes(dataset.disease ?? "")) return false;
      if (assays.length && !assays.includes(dataset.assay ?? "")) return false;
      return true;
    });

    const items = filtered.slice(offset, offset + limit);
    const nextOffset = offset + items.length;

    return DatasetListResponseSchema.parse({
      data_mode: DATA_MODE,
      generated_at: now(),
      items,
      total: filtered.length,
      limit,
      next_cursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null,
      facets: {
        tissues: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.tissue)),
        diseases: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.disease)),
        assays: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.assay)),
      },
    });
  }

  async getDataset(datasetId: string): Promise<DatasetDetail | null> {
    const dataset = getDemoDataset(datasetId);
    return dataset ? DatasetDetailSchema.parse(dataset) : null;
  }

  async searchCpgs(query: string, assembly: "GRCh38"): Promise<CpgSearchResponse> {
    if (assembly !== "GRCh38") {
      throw new ProviderError(
        "unsupported_assembly",
        "Only GRCh38/hg38 is supported by this prototype.",
        400,
      );
    }

    const parsed = parseSearchQuery(query);
    const base = {
      data_mode: DATA_MODE,
      generated_at: now(),
      query,
    } as const;

    if (parsed.kind === "empty") {
      return CpgSearchResponseSchema.parse({
        ...base,
        query_type: "empty",
        gene: null,
        items: [],
        empty_reason: "Enter a gene symbol, a CpG probe ID, or a GRCh38 region.",
      });
    }

    if (parsed.kind === "gene") {
      const gene = GENE_BY_SYMBOL.get(parsed.value);
      if (!gene) {
        return CpgSearchResponseSchema.parse({
          ...base,
          query_type: "gene",
          gene: null,
          items: [],
          empty_reason: `No demo gene record for ${parsed.value}. Demo genes: ${Array.from(
            GENE_BY_SYMBOL.keys(),
          ).join(", ")}.`,
        });
      }
      const items = gene.cpg_ids
        .map((id) => CPG_BY_ID.get(id))
        .filter((cpg): cpg is NonNullable<typeof cpg> => Boolean(cpg));
      return CpgSearchResponseSchema.parse({
        ...base,
        query_type: "gene",
        gene,
        items,
        empty_reason: items.length ? null : "No demo CpGs are mapped to this gene.",
      });
    }

    if (parsed.kind === "probe") {
      const cpg = CPG_BY_ID.get(parsed.value);
      if (!cpg) {
        return CpgSearchResponseSchema.parse({
          ...base,
          query_type: "probe",
          gene: null,
          items: [],
          empty_reason: `Probe format recognised, but ${parsed.value} is not in the demo panel.`,
        });
      }
      return CpgSearchResponseSchema.parse({
        ...base,
        query_type: "probe",
        gene: null,
        items: [cpg],
        empty_reason:
          cpg.annotation_status === "annotation_withheld"
            ? "Probe ID accepted. Genomic annotation is intentionally withheld in this demo; no real coordinate is implied."
            : null,
      });
    }

    if (parsed.kind === "region") {
      const { chrom, internal } = parsed.region;
      const items = DEMO_CPGS.filter(
        (cpg) =>
          cpg.chrom === chrom &&
          cpg.start !== null &&
          cpg.end !== null &&
          cpg.start >= internal.start &&
          cpg.end <= internal.end,
      );
      return CpgSearchResponseSchema.parse({
        ...base,
        query_type: "region",
        gene: null,
        items,
        empty_reason: items.length
          ? null
          : `No demo panel CpGs fall inside ${chrom}:${internal.start}-${internal.end} (0-based half-open).`,
      });
    }

    return CpgSearchResponseSchema.parse({
      ...base,
      query_type: "unknown",
      gene: null,
      items: [],
      empty_reason:
        "Unrecognised query. Use a gene symbol (TP53), a probe ID (cg00000029), or chr17:7,668,001-7,690,000.",
    });
  }

  async listGroups(query: GroupsQuery): Promise<GroupsResponse> {
    const cpgId = query.cpg_id ?? DEFAULT_CPG_PANEL[0];
    if (!CPG_BY_ID.has(cpgId)) {
      throw new ProviderError("cpg_not_found", `Unknown CpG: ${cpgId}`, 404);
    }
    if (query.dataset_id && !getDemoDataset(query.dataset_id)) {
      throw new ProviderError(
        "dataset_not_found",
        `Unknown dataset: ${query.dataset_id}`,
        404,
      );
    }

    const cells = Object.values(CELLS_BY_DATASET)
      .flat()
      .filter((cell) => {
        if (query.dataset_id && cell.dataset_id !== query.dataset_id) return false;
        if (query.tissue && cell.tissue !== query.tissue) return false;
        if (query.cell_type && cell.cell_type !== query.cell_type) return false;
        return true;
      });

    return GroupsResponseSchema.parse({
      data_mode: DATA_MODE,
      generated_at: now(),
      items: groupSummaryByCellType(cells, cpgId),
      cpg_id: cpgId,
      filters: {
        dataset_id: query.dataset_id ?? null,
        tissue: query.tissue ?? null,
        cell_type: query.cell_type ?? null,
      },
    });
  }

  async previewPredictions(input: unknown): Promise<PredictionPreviewResponse> {
    const request = PredictionRequestSchema.parse(input);
    const dataset = getDemoDataset(request.dataset_id);
    if (!dataset) {
      throw new ProviderError(
        "dataset_not_found",
        `Unknown dataset: ${request.dataset_id}`,
        404,
      );
    }
    const cpgs = request.cpg_ids.map((id) => {
      const cpg = CPG_BY_ID.get(id);
      if (!cpg) throw new ProviderError("cpg_not_found", `Unknown CpG: ${id}`, 404);
      return cpg;
    });
    if (dataset.stages.excluded) {
      throw new ProviderError(
        "dataset_excluded",
        `${dataset.dataset_id} is excluded from prediction in this demo.`,
        409,
      );
    }

    const datasetCells = CELLS_BY_DATASET[dataset.dataset_id] ?? [];
    const selectedCells = request.cell_ids?.length
      ? request.cell_ids
          .map((id) => CELL_BY_ID.get(id))
          .filter(
            (cell): cell is NonNullable<typeof cell> =>
              Boolean(cell) && cell?.dataset_id === dataset.dataset_id,
          )
      : datasetCells.slice(0, 24);

    if (selectedCells.length === 0) {
      throw new ProviderError(
        "no_cells",
        "No demo cells selected for this dataset.",
        400,
      );
    }

    const predictions = selectedCells.flatMap((cell) =>
      cpgs.map((cpg) => ({
        model_id: "CPGMoE (demo specification)",
        dataset_id: dataset.dataset_id,
        cell_id: cell.cell_id,
        cpg_id: cpg.cpg_id,
        genome_build: "GRCh38" as const,
        predicted_beta: Math.round(
          ((cell.predicted_beta_demo + cpg.synthetic_beta) / 2) * 1000,
        ) / 1000,
        provenance_id: `DEMO_PROV_${dataset.dataset_id}_${cpg.cpg_id}`,
        is_synthetic_demo: true as const,
      })),
    );

    return PredictionPreviewResponseSchema.parse({
      data_mode: DATA_MODE,
      is_synthetic_demo: true,
      model_id: "CPGMoE (demo specification)",
      checkpoint_loaded: false,
      provenance_id: `DEMO_PROV_${dataset.dataset_id}`,
      predictions,
      caveat:
        "Synthetic preview only. No checkpoint was loaded and no model inference was executed.",
    });
  }

  async previewCompare(input: unknown): Promise<ComparePreviewResponse> {
    const request = CompareRequestSchema.parse(input);
    const cpgs = request.cpg_ids.map((id) => {
      const cpg = CPG_BY_ID.get(id);
      if (!cpg) throw new ProviderError("cpg_not_found", `Unknown CpG: ${id}`, 404);
      return cpg;
    });

    const cellsA = resolveCompareCells(request.group_a.dimension, request.group_a.value);
    const cellsB = resolveCompareCells(request.group_b.dimension, request.group_b.value);
    const meansA = groupMeansForCells(cellsA, cpgs.map((cpg) => cpg.cpg_id));
    const meansB = groupMeansForCells(cellsB, cpgs.map((cpg) => cpg.cpg_id));

    const deltas = cpgs.map((cpg, index) => {
      const a = meansA[index]?.value ?? null;
      const b = meansB[index]?.value ?? null;
      return {
        cpg_id: cpg.cpg_id,
        delta:
          a !== null && b !== null ? Math.round((b - a) * 1000) / 1000 : null,
      };
    });

    return ComparePreviewResponseSchema.parse({
      data_mode: DATA_MODE,
      is_synthetic_demo: true,
      group_a: {
        label: `${request.group_a.dimension}: ${request.group_a.value}`,
        n_cells: cellsA.length,
        aggregation: "mean_of_synthetic_cell_predictions",
        means: meansA,
      },
      group_b: {
        label: `${request.group_b.dimension}: ${request.group_b.value}`,
        n_cells: cellsB.length,
        aggregation: "mean_of_synthetic_cell_predictions",
        means: meansB,
      },
      deltas,
      statistical_tests: "unavailable_in_demo",
      caveat:
        "Comparisons are based on predicted methylation, not experimentally observed DMRs. No p-values or FDR estimates are produced in this demo.",
    });
  }

  async getModels(): Promise<ModelsResponse> {
    return ModelsResponseSchema.parse({
      data_mode: DATA_MODE,
      generated_at: now(),
      items: [
        {
          model_id: "cpgmoe",
          display_name: "CPGMoE",
          architecture: "Bulk multi-omics encoder with CpG-specific prediction heads",
          training_data: "TCGA bulk multi-omics (per project brief)",
          target_space: "Illumina 450K panel CpGs",
          genome_build: "GRCh38",
          checkpoint_hash: null,
          release_status: "research_preview",
          prediction_semantics: "predicted_beta",
          limitations: [
            "Bulk-to-single-cell domain transfer is not validated for clinical use.",
            "Panel-based target space; not a genome-wide measurement.",
            "No checkpoint is loaded in this prototype.",
          ],
        },
      ],
    });
  }

  async getSchema(): Promise<SchemaResponse> {
    return SchemaResponseSchema.parse({
      data_mode: DATA_MODE,
      generated_at: now(),
      coordinate_convention: {
        internal: "0-based half-open",
        ui: "1-based inclusive",
        genome_build: "GRCh38",
      },
      fields: [
        {
          name: "dataset_id",
          type: "string",
          description: "Stable dataset identifier; demo identifiers start with DEMO_.",
          nullable: false,
        },
        {
          name: "status",
          type: "enum",
          description: "Lifecycle state of the dataset in the atlas pipeline.",
          domain: [
            "synthetic_demo",
            "metadata_only",
            "rna_qc_passed",
            "encoded",
            "predicted",
            "restricted",
            "excluded",
          ],
          nullable: false,
        },
        {
          name: "evidence_tier",
          type: "enum",
          description: "Curator-assigned evidence quality tier; A is strongest.",
          domain: ["A", "B", "C", "unverified"],
          nullable: true,
        },
        {
          name: "license_status",
          type: "enum",
          description: "Reuse status tracked by the data governance workflow.",
          domain: ["approved", "pending", "restricted"],
          nullable: true,
        },
        {
          name: "n_cells",
          type: "integer | null",
          description:
            "Illustrative cell count in demo records; production counts stay null until audited.",
          nullable: true,
        },
        {
          name: "predicted_beta",
          type: "number [0,1]",
          description:
            "Predicted methylation beta from CPGMoE. Never a measured scDNAm value.",
          nullable: false,
        },
        {
          name: "provenance_id",
          type: "string",
          description:
            "Identifier linking a prediction to model, checkpoint, input, and audit records.",
          nullable: false,
        },
        {
          name: "is_synthetic_demo",
          type: "boolean",
          description:
            "True for every Phase 0 value. Real values must be generated by an audited provider.",
          nullable: false,
        },
      ],
    });
  }
}

let provider: AtlasDataProvider | null = null;

export function getAtlasDataProvider(): AtlasDataProvider {
  if (!provider) {
    provider = new SyntheticAtlasProvider();
  }
  return provider;
}

export const ATLAS_FACETS = {
  tissues: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.tissue)),
  diseases: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.disease)),
  assays: uniqueSorted(DEMO_DATASETS.map((dataset) => dataset.assay)),
  cellTypes: UNIQUE_CELL_TYPES,
};

export { AtlasDatasetSchema };
