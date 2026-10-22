import type { CpgRecord, GeneRecord, GroupSummary } from "@/lib/schemas";
import type { CellRecord } from "@/lib/schemas";
import { syntheticBetaForCellAndCpg } from "@/mock/cells";

export const DEMO_GENES: GeneRecord[] = [
  {
    gene_symbol: "TP53",
    genome_build: "GRCh38",
    chrom: "chr17",
    start: 7668000,
    end: 7690000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0001", "cgDEMO0002"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "EGFR",
    genome_build: "GRCh38",
    chrom: "chr7",
    start: 55000000,
    end: 55200000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0006"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "CDKN2A",
    genome_build: "GRCh38",
    chrom: "chr9",
    start: 21900000,
    end: 22000000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0003"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "MLH1",
    genome_build: "GRCh38",
    chrom: "chr3",
    start: 37000000,
    end: 37100000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0004"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "BRCA1",
    genome_build: "GRCh38",
    chrom: "chr17",
    start: 43000000,
    end: 43100000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0005"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "PIK3CA",
    genome_build: "GRCh38",
    chrom: "chr3",
    start: 179000000,
    end: 179100000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0007"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "APC",
    genome_build: "GRCh38",
    chrom: "chr5",
    start: 112700000,
    end: 112800000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0008"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "KRAS",
    genome_build: "GRCh38",
    chrom: "chr12",
    start: 25200000,
    end: 25300000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0009"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "PTEN",
    genome_build: "GRCh38",
    chrom: "chr10",
    start: 87800000,
    end: 87900000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0010"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "RB1",
    genome_build: "GRCh38",
    chrom: "chr13",
    start: 48300000,
    end: 48400000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0011"],
    is_synthetic_demo: true,
  },
  {
    gene_symbol: "CDH1",
    genome_build: "GRCh38",
    chrom: "chr16",
    start: 68700000,
    end: 68800000,
    coordinate_status: "illustrative",
    transcript_status: "demo_model",
    cpg_ids: ["cgDEMO0012"],
    is_synthetic_demo: true,
  },
];

export const DEMO_CPGS: CpgRecord[] = [
  {
    cpg_id: "cgDEMO0001",
    panel_slot: "P01",
    gene_symbol: "TP53",
    genome_build: "GRCh38",
    chrom: "chr17",
    start: 7668400,
    end: 7668402,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.31,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0002",
    panel_slot: "P02",
    gene_symbol: "TP53",
    genome_build: "GRCh38",
    chrom: "chr17",
    start: 7671200,
    end: 7671202,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.38,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0003",
    panel_slot: "P03",
    gene_symbol: "CDKN2A",
    genome_build: "GRCh38",
    chrom: "chr9",
    start: 2195050,
    end: 2195052,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.19,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0004",
    panel_slot: "P04",
    gene_symbol: "MLH1",
    genome_build: "GRCh38",
    chrom: "chr3",
    start: 3702500,
    end: 3702502,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.63,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0005",
    panel_slot: "P05",
    gene_symbol: "BRCA1",
    genome_build: "GRCh38",
    chrom: "chr17",
    start: 4303600,
    end: 4303602,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.27,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0006",
    panel_slot: "P06",
    gene_symbol: "EGFR",
    genome_build: "GRCh38",
    chrom: "chr7",
    start: 5506200,
    end: 5506202,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.47,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0007",
    panel_slot: "P07",
    gene_symbol: "PIK3CA",
    genome_build: "GRCh38",
    chrom: "chr3",
    start: 17902500,
    end: 17902502,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.55,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0008",
    panel_slot: "P08",
    gene_symbol: "APC",
    genome_build: "GRCh38",
    chrom: "chr5",
    start: 11273500,
    end: 11273502,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.22,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0009",
    panel_slot: "P09",
    gene_symbol: "KRAS",
    genome_build: "GRCh38",
    chrom: "chr12",
    start: 2524800,
    end: 2524802,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.41,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0010",
    panel_slot: "P10",
    gene_symbol: "PTEN",
    genome_build: "GRCh38",
    chrom: "chr10",
    start: 8783400,
    end: 8783402,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.58,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0011",
    panel_slot: "P11",
    gene_symbol: "RB1",
    genome_build: "GRCh38",
    chrom: "chr13",
    start: 4832900,
    end: 4832902,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.35,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cgDEMO0012",
    panel_slot: "P12",
    gene_symbol: "CDH1",
    genome_build: "GRCh38",
    chrom: "chr16",
    start: 6872700,
    end: 6872702,
    annotation_status: "synthetic_window",
    synthetic_beta: 0.44,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cg00000029",
    panel_slot: "ID-FORMAT-A",
    gene_symbol: null,
    genome_build: "GRCh38",
    chrom: null,
    start: null,
    end: null,
    annotation_status: "annotation_withheld",
    synthetic_beta: 0.42,
    is_synthetic_demo: true,
  },
  {
    cpg_id: "cg00000030",
    panel_slot: "ID-FORMAT-B",
    gene_symbol: null,
    genome_build: "GRCh38",
    chrom: null,
    start: null,
    end: null,
    annotation_status: "annotation_withheld",
    synthetic_beta: 0.57,
    is_synthetic_demo: true,
  },
];

export const CPG_BY_ID = new Map(DEMO_CPGS.map((cpg) => [cpg.cpg_id, cpg]));
export const GENE_BY_SYMBOL = new Map(DEMO_GENES.map((gene) => [gene.gene_symbol, gene]));

export const DEFAULT_CPG_PANEL = DEMO_CPGS.filter(
  (cpg) => cpg.annotation_status === "synthetic_window",
)
  .slice(0, 8)
  .map((cpg) => cpg.cpg_id);

export function meanBetaForCells(cells: CellRecord[], cpgId: string): number | null {
  if (cells.length === 0) return null;
  const total = cells.reduce(
    (sum, cell) => sum + syntheticBetaForCellAndCpg(cell.cell_id, cpgId),
    0,
  );
  return Math.round((total / cells.length) * 1000) / 1000;
}

export function groupMeansForCells(
  cells: CellRecord[],
  cpgIds: string[],
): Array<{ cpg_id: string; value: number | null }> {
  return cpgIds.map((cpgId) => ({
    cpg_id: cpgId,
    value: meanBetaForCells(cells, cpgId),
  }));
}

export function groupSummaryByCellType(
  cells: CellRecord[],
  cpgId: string,
): GroupSummary[] {
  const grouped = new Map<string, CellRecord[]>();
  cells.forEach((cell) => {
    const list = grouped.get(cell.cell_type) ?? [];
    list.push(cell);
    grouped.set(cell.cell_type, list);
  });

  return Array.from(grouped.entries())
    .map(([cellType, members]) => ({
      group_id: `cell_type:${cellType}`,
      label: cellType,
      dataset_id: null,
      tissue: null,
      disease: null,
      cell_type: cellType,
      n_cells: members.length,
      cpg_id: cpgId,
      mean_predicted_beta: meanBetaForCells(members, cpgId),
      aggregation: "mean_of_synthetic_cell_predictions" as const,
      is_synthetic_demo: true as const,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
