# Pilot release — 3M-cell Full-S3 predicted methylation

Status: **research preview (pilot)**. Not the final pan-human atlas.

## 1. Release identity

| Field | Value |
| --- | --- |
| `release_id` | `pilot_3m_20261024` |
| `data_mode` | `pilot_predicted` |
| `prediction_type` | `predicted_beta` |
| `provenance_status` | `pilot_aggregate` |
| Aggregation | `mean_of_single_cell_predictions_per_tissue_x_cell_type` |

## 2. What is served

| Quantity | Value | Note |
| --- | --- | --- |
| Pilot cells | 3,000,000 | selected 3M pan-tissue cohort |
| Cells inside profiled groups | 2,933,703 | remaining cells fall outside groups with ≥1 tissue/cell-type assignment |
| Groups | 2,093 | tissue × cell-type |
| High-confidence groups | 564 | n_cells ≥ 100, n_donors ≥ 3, n_datasets ≥ 2 |
| Tissues | 205 | |
| Cell types | 435 | |
| Panel probes predicted | 485,403 | full panel produced offline |
| CpGs in the web slice | 512 | pre-declared high-variance panel |
| Annotated CpGs | 512 | hg38 coordinate + island/gene/promoter |

All values are **predicted** by Full-S3 and aggregated offline. No measured
methylation is shown.

## 3. Checkpoint provenance

Read from `frozen_hash_manifest.tsv` produced by the offline run:

| Artifact | Size | SHA-256 |
| --- | --- | --- |
| `pytorch_model.bin` | 185,052,254 bytes | `1f1fcfce618ba29299f1ff31dd4892af0af73ec4e1e4767e47404effed5ec7ea` |
| `config.json` | 554 bytes | `b0b5ebb1e447127023fb71765be4e893aa051f2933063560173adc7766acef72` |

The website never executes inference. It consumes aggregates only.

## 4. What is explicitly not included

- per-cell predictions (the 3M × 512 matrix is not shipped)
- raw single-cell RNA
- donor-level rows or donor identifiers
- the full 485,403 × 2,093 aggregate matrix
- CpGs outside the 512-CpG high-variance panel
- statistical tests (no independent-replicate model)
- clinical, causal or regulatory claims

The final pan-human atlas is **not released**. 3M is a pilot, not the atlas
denominator.

## 5. Bundle layout

Generated into `src/data/pilot/` by `scripts/pilot/build_pilot_bundle.py`:

| File | Content |
| --- | --- |
| `release.json` | release identity, counts, checkpoint, caveat |
| `groups.json` | 2,093 groups: tissue, cell_type, organ_system, n_cells, n_donors, n_datasets, high_confidence |
| `cpgs.json` | 512 CpGs: hg38 chr/pos, island relation, gene, promoter, variance |
| `cpg_stats.json` | per-CpG mean / sd / min / p10 / median / p90 / max |
| `profile.json` | 2,093 × 512 beta, quantised ×1000 |
| `heatmap.json` | 16 organ-system aggregates + 48 largest groups |

Total ≈ 5 MB, server-side only. Client bundles receive only the current view.

## 6. Rebuilding

Inputs (aggregated tables from the offline 3M run):

```text
tissue_celltype_group_metadata.parquet      2,093 groups
tissue_celltype_high_variance_mean.parquet  2,093 × 512 mean beta
selected_high_variance_cpgs.parquet         512-CpG panel
pilot_eff512.tsv                            hg38 probe coordinates
pilot_ann512.tsv                            island / gene / promoter annotation
frozen_hash_manifest.tsv                    checkpoint provenance
```

```bash
PILOT_SOURCE_DIR=/path/to/pilot-data python scripts/pilot/build_pilot_bundle.py
```

The ETL validates that the 512 panel columns exist before writing; it does not
guess missing fields or paths.

## 7. API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/pilot/release` | release identity + counts |
| GET | `/api/v1/pilot/search?q=` | gene / probe / hg38 interval / group |
| GET | `/api/v1/pilot/cpgs/{cpg_id}` | annotation, stats, top groups |
| GET | `/api/v1/pilot/groups` | list + filters (`q`, `tissue`, `cell_type`, `organ_system`, `high_confidence`) |
| GET | `/api/v1/pilot/groups/{id}` | group detail + top CpGs |
| GET | `/api/v1/pilot/heatmap` | organ-system and top-group matrices |
| POST | `/api/v1/pilot/compare` | `{ group_a, group_b, cpg_ids[] }` → Δβ |

All responses carry `data_mode: "pilot_predicted"`, `release_id`,
`prediction_type`, `provenance_status`, plus the `X-Data-Mode` and
`X-Release-Id` headers. `POST /compare` always returns
`statistical_tests: "unavailable"`.

## 8. Mode switch

- Default build: `pilot_predicted`
- Phase 0 demo: build with `NEXT_PUBLIC_ATLAS_MODE=synthetic_demo`

The switch only changes which provider/pages are used. It never relabels stored
values.

## 9. Known gaps against the Phase 1 brief

| Brief item | Status |
| --- | --- |
| Query a real gene / probe / interval | Done for the 512-CpG panel (182 genes annotated) |
| Group-level β with support counts | Done (2,093 groups, 512 CpGs) |
| Cell Type Atlas / Tissue Explorer | Adapted to tissue × cell-type groups (`/groups`) |
| Atlas as heatmap-first | Done (`/atlas`) |
| Compare with effect sizes | Done (Δβ only, no p-values) |
| Full 485,403-probe browser | **Not done** — only 512 CpGs carry group aggregates |
| TP53 example | **Unavailable** — TP53 is not on the 512 high-variance panel |
| Downloads | Pilot aggregates are not yet exposed as files |
