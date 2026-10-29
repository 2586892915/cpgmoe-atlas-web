import signatureData from "@/data/pilot/signatures.json";

export type SignatureCpg = {
  cpg_id: string;
  gene: string | null;
  beta: number;
  delta: number;
};

export type SignatureGroup = {
  group_index: number;
  label: string;
  n_cells: number;
  n_donors: number;
  n_datasets: number;
  supported: boolean;
  top: SignatureCpg[];
};

type SignatureFile = {
  release_id: string;
  top_n: number;
  min_variance: number;
  levels: Record<string, { n_groups: number; items: SignatureGroup[] }>;
};

const data = signatureData as unknown as SignatureFile;

export const SIGNATURE_META = {
  release_id: data.release_id,
  top_n: data.top_n,
  min_variance: data.min_variance,
};

export function cellTypeSignatures(): SignatureGroup[] {
  return data.levels.celltype?.items ?? [];
}

export function getCellTypeSignature(index: number): SignatureGroup | null {
  return cellTypeSignatures().find((item) => item.group_index === index) ?? null;
}

export function tissueSignatures(): SignatureGroup[] {
  return data.levels.tissue?.items ?? [];
}

export function getTissueSignature(label: string): SignatureGroup | null {
  return tissueSignatures().find((item) => item.label === label) ?? null;
}
