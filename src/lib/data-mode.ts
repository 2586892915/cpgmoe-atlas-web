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

/**
 * Phase 1 mode switch.
 *
 * `pilot_predicted` serves the 3M-cell Full-S3 pilot aggregates that have been
 * produced offline. `synthetic_demo` keeps the original Phase 0 demo available
 * (set NEXT_PUBLIC_ATLAS_MODE=synthetic_demo). The switch never changes the
 * meaning of a stored value: pilot responses carry their own release id.
 */
export type AtlasMode = "synthetic_demo" | "pilot_predicted";

export const ACTIVE_DATA_MODE: AtlasMode =
  process.env.NEXT_PUBLIC_ATLAS_MODE === "synthetic_demo"
    ? "synthetic_demo"
    : "pilot_predicted";

export const IS_PILOT = ACTIVE_DATA_MODE === "pilot_predicted";

export const MODE_BANNER = IS_PILOT
  ? "Pilot release"
  : "Demo environment — synthetic data only";

export const MODE_BANNER_DETAIL = IS_PILOT
  ? "3.0M cells · 2,093 groups · 485,403 CpGs"
  : "Illustrative values only.";
