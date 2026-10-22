import { z } from "zod";

export const DATA_MODE_VALUE = "synthetic_demo" as const;

export const DataStatusSchema = z.enum([
  "synthetic_demo",
  "metadata_only",
  "rna_qc_passed",
  "encoded",
  "predicted",
  "restricted",
  "excluded",
]);
export type DataStatus = z.infer<typeof DataStatusSchema>;

export const EvidenceTierSchema = z.enum(["A", "B", "C", "unverified"]);
export type EvidenceTier = z.infer<typeof EvidenceTierSchema>;

export const LicenseStatusSchema = z.enum(["approved", "pending", "restricted"]);
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

export const AtlasDatasetSchema = z.object({
  dataset_id: z.string().min(1),
  collection_id: z.string().optional(),
  title: z.string().min(1),
  species: z.literal("Homo sapiens"),
  tissue: z.string().optional(),
  disease: z.string().optional(),
  assay: z.string().optional(),
  n_cells: z.number().int().nonnegative().nullable().optional(),
  n_donors: z.number().int().nonnegative().nullable().optional(),
  source_url: z.string().url().optional(),
  status: DataStatusSchema,
  evidence_tier: EvidenceTierSchema.optional(),
  license_status: LicenseStatusSchema.optional(),
});
export type AtlasDataset = z.infer<typeof AtlasDatasetSchema>;

export const DatasetStagesSchema = z.object({
  indexed: z.boolean(),
  rna_qc_passed: z.boolean(),
  encoded: z.boolean(),
  predicted: z.boolean(),
  excluded: z.boolean(),
});

export const DatasetQcSchema = z.object({
  rna_qc_pass_rate: z.number().min(0).max(100),
  median_genes: z.number().int().nonnegative(),
  median_umi: z.number().int().nonnegative(),
  doublet_rate: z.number().min(0).max(100),
});

export const DatasetDetailSchema = AtlasDatasetSchema.extend({
  summary: z.string(),
  cell_types: z.array(z.string().min(1)).min(1),
  stages: DatasetStagesSchema,
  qc: DatasetQcSchema,
  provenance: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  usage_note: z.string(),
  model_applicability: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
});
export type DatasetDetail = z.infer<typeof DatasetDetailSchema>;

export const CellRecordSchema = z.object({
  cell_id: z.string().min(1),
  dataset_id: z.string().min(1),
  cell_type: z.string().min(1),
  tissue: z.string().min(1),
  disease: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  predicted_beta_demo: z.number().min(0).max(1),
  is_synthetic_demo: z.literal(true),
});
export type CellRecord = z.infer<typeof CellRecordSchema>;

export const PredictedMethylationSchema = z.object({
  model_id: z.string().min(1),
  dataset_id: z.string().min(1),
  cell_id: z.string().optional(),
  group_id: z.string().optional(),
  cpg_id: z.string().min(1),
  genome_build: z.literal("GRCh38"),
  predicted_beta: z.number().min(0).max(1),
  n_cells_aggregated: z.number().int().nonnegative().optional(),
  provenance_id: z.string().min(1),
  is_synthetic_demo: z.literal(true),
});
export type PredictedMethylation = z.infer<typeof PredictedMethylationSchema>;

export const CpgAnnotationStatusSchema = z.enum([
  "synthetic_window",
  "annotation_withheld",
]);

export const CpgRecordSchema = z.object({
  cpg_id: z.string().min(1),
  panel_slot: z.string().min(1),
  gene_symbol: z.string().nullable(),
  genome_build: z.literal("GRCh38"),
  chrom: z.string().nullable(),
  start: z.number().int().nonnegative().nullable(),
  end: z.number().int().nonnegative().nullable(),
  annotation_status: CpgAnnotationStatusSchema,
  synthetic_beta: z.number().min(0).max(1),
  is_synthetic_demo: z.literal(true),
});
export type CpgRecord = z.infer<typeof CpgRecordSchema>;

export const GeneRecordSchema = z.object({
  gene_symbol: z.string().min(1),
  genome_build: z.literal("GRCh38"),
  chrom: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  coordinate_status: z.literal("illustrative"),
  transcript_status: z.literal("demo_model"),
  cpg_ids: z.array(z.string()),
  is_synthetic_demo: z.literal(true),
});
export type GeneRecord = z.infer<typeof GeneRecordSchema>;

export const GroupSummarySchema = z.object({
  group_id: z.string().min(1),
  label: z.string().min(1),
  dataset_id: z.string().nullable(),
  tissue: z.string().nullable(),
  disease: z.string().nullable(),
  cell_type: z.string().nullable(),
  n_cells: z.number().int().nonnegative(),
  cpg_id: z.string(),
  mean_predicted_beta: z.number().min(0).max(1).nullable(),
  aggregation: z.literal("mean_of_synthetic_cell_predictions"),
  is_synthetic_demo: z.literal(true),
});
export type GroupSummary = z.infer<typeof GroupSummarySchema>;

export const DatasetListResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  items: z.array(DatasetDetailSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  next_cursor: z.string().nullable(),
  facets: z.object({
    tissues: z.array(z.string()),
    diseases: z.array(z.string()),
    assays: z.array(z.string()),
  }),
});
export type DatasetListResponse = z.infer<typeof DatasetListResponseSchema>;

export const StatusResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  status: z.literal("prototype"),
  audit_state: z.literal("in_progress"),
  message: z.string(),
  catalogue: z.object({
    synthetic_datasets: z.number().int(),
    production_datasets: z.null(),
  }),
  coverage: z.object({
    indexed_cells: z.null(),
    eligible_cells: z.null(),
    encoded_cells: z.null(),
    predicted_cells: z.null(),
  }),
  model: z.object({
    model_id: z.string(),
    checkpoint_hash: z.null(),
    prediction_semantics: z.literal("predicted_beta"),
  }),
});
export type StatusResponse = z.infer<typeof StatusResponseSchema>;

export const ModelsResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  items: z.array(
    z.object({
      model_id: z.string(),
      display_name: z.string(),
      architecture: z.string(),
      training_data: z.string(),
      target_space: z.string(),
      genome_build: z.literal("GRCh38"),
      checkpoint_hash: z.null(),
      release_status: z.literal("research_preview"),
      prediction_semantics: z.literal("predicted_beta"),
      limitations: z.array(z.string()),
    }),
  ),
});
export type ModelsResponse = z.infer<typeof ModelsResponseSchema>;

export const CpgSearchResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  query: z.string(),
  query_type: z.enum(["empty", "gene", "probe", "region", "unknown"]),
  gene: GeneRecordSchema.nullable(),
  items: z.array(CpgRecordSchema),
  empty_reason: z.string().nullable(),
});
export type CpgSearchResponse = z.infer<typeof CpgSearchResponseSchema>;

export const GroupsResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  items: z.array(GroupSummarySchema),
  cpg_id: z.string(),
  filters: z.object({
    dataset_id: z.string().nullable(),
    tissue: z.string().nullable(),
    cell_type: z.string().nullable(),
  }),
});
export type GroupsResponse = z.infer<typeof GroupsResponseSchema>;

export const SchemaResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  generated_at: z.string(),
  coordinate_convention: z.object({
    internal: z.literal("0-based half-open"),
    ui: z.literal("1-based inclusive"),
    genome_build: z.literal("GRCh38"),
  }),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      domain: z.array(z.string()).optional(),
      nullable: z.boolean(),
    }),
  ),
});
export type SchemaResponse = z.infer<typeof SchemaResponseSchema>;

export const PredictionRequestSchema = z.object({
  dataset_id: z.string().min(1),
  cpg_ids: z.array(z.string().min(1)).min(1).max(24),
  cell_ids: z.array(z.string().min(1)).max(100).optional(),
});

export const PredictionPreviewResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  is_synthetic_demo: z.literal(true),
  model_id: z.string(),
  checkpoint_loaded: z.literal(false),
  provenance_id: z.string(),
  predictions: z.array(PredictedMethylationSchema),
  caveat: z.string(),
});
export type PredictionPreviewResponse = z.infer<
  typeof PredictionPreviewResponseSchema
>;

export const CompareGroupInputSchema = z.object({
  dimension: z.enum(["dataset", "tissue", "cell_type"]),
  value: z.string().min(1),
});

export const CompareRequestSchema = z.object({
  group_a: CompareGroupInputSchema,
  group_b: CompareGroupInputSchema,
  cpg_ids: z.array(z.string().min(1)).min(1).max(24),
});

export const ComparePreviewResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  is_synthetic_demo: z.literal(true),
  group_a: z.object({
    label: z.string(),
    n_cells: z.number().int().nonnegative(),
    aggregation: z.literal("mean_of_synthetic_cell_predictions"),
    means: z.array(z.object({ cpg_id: z.string(), value: z.number().min(0).max(1).nullable() })),
  }),
  group_b: z.object({
    label: z.string(),
    n_cells: z.number().int().nonnegative(),
    aggregation: z.literal("mean_of_synthetic_cell_predictions"),
    means: z.array(z.object({ cpg_id: z.string(), value: z.number().min(0).max(1).nullable() })),
  }),
  deltas: z.array(z.object({ cpg_id: z.string(), delta: z.number().min(-1).max(1).nullable() })),
  statistical_tests: z.literal("unavailable_in_demo"),
  caveat: z.string(),
});
export type ComparePreviewResponse = z.infer<
  typeof ComparePreviewResponseSchema
>;

export const ErrorResponseSchema = z.object({
  data_mode: z.literal(DATA_MODE_VALUE),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
