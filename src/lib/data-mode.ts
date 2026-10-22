/**
 * Single source of truth for the data plane.
 *
 * Phase 0 always runs in synthetic mode. Switching to audited data must NOT be
 * done by flipping this constant alone: a real provider has to be generated
 * from audit/provenance artefacts and wired in explicitly (see docs/INTEGRATION_PLAN.md).
 */
export const DATA_MODE = "synthetic_demo" as const;

export type DataMode = typeof DATA_MODE | "audited_release";

export const IS_SYNTHETIC = DATA_MODE === "synthetic_demo";

export const DATA_MODE_BANNER = "Demo environment — synthetic data only";

export const AUDIT_STATE_LABEL = "Data audit in progress";

export const MODEL_EVIDENCE_NOTE =
  "Research-use prediction; not measured single-cell DNA methylation.";
