"""Build the Phase 1 pilot web bundle from the offline 3M-cell Full-S3 outputs.

Inputs (aggregated artefacts only):
  tissue_celltype_group_metadata.parquet     2,093 tissue x cell-type groups
  tissue_celltype_high_variance_mean.parquet 2,093 x 512 mean predicted beta
  selected_high_variance_cpgs.parquet         512-CpG panel + variance
  effective_full450k.tsv                      hg38 probe coordinates
  pilot_ann512.tsv                            island / gene / promoter annotation
  frozen_hash_manifest.tsv                    checkpoint provenance (sha256)

No per-cell predictions, no raw RNA, no donor-level rows.

Usage:
  PILOT_SOURCE_DIR=... python scripts/pilot/build_pilot_bundle.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

DEFAULT_SOURCE = Path(__file__).resolve().parents[4] / "work" / "pilot-data"
SOURCE = Path(os.environ.get("PILOT_SOURCE_DIR", DEFAULT_SOURCE))
OUT = Path(
    os.environ.get(
        "PILOT_OUT_DIR",
        Path(__file__).resolve().parents[2] / "src" / "data" / "pilot",
    )
)


def write_json(name: str, payload) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (OUT / name).write_text(text, encoding="utf-8")
    print(f"{name:22s} {len(text)/1024:9.1f} KB")


def clean_text(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if text.lower() in {"", "nan", "none", "na"}:
        return None
    return text


def main() -> None:
    meta = pd.read_parquet(SOURCE / "tissue_celltype_group_metadata.parquet")
    mean = pd.read_parquet(SOURCE / "tissue_celltype_high_variance_mean.parquet")
    panel = pd.read_parquet(SOURCE / "selected_high_variance_cpgs.parquet")
    coords = pd.read_csv(SOURCE / "pilot_eff512.tsv", sep="\t")
    annotation = pd.read_csv(SOURCE / "pilot_ann512.tsv", sep="\t")

    cpg_ids = [c for c in mean.columns if str(c).startswith("cg")]
    panel = panel.set_index("probe_id").loc[cpg_ids].reset_index()
    coords = coords.drop_duplicates("probe_id").set_index("probe_id")
    annotation = annotation.drop_duplicates("probe_id").set_index("probe_id")

    meta = meta.sort_values("group_index").reset_index(drop=True)
    groups = [
        {
            "group_id": int(row["group_index"]),
            "group_key": row["group_key"],
            "tissue": row["tissue"],
            "cell_type": row["cell_type"],
            "organ_system": row["organ_system"],
            "n_cells": int(row["n_cells"]),
            "n_donors": int(row["n_donors"]),
            "n_datasets": int(row["n_datasets"]),
            "high_confidence": bool(
                row["n_cells"] >= 100
                and row["n_donors"] >= 3
                and row["n_datasets"] >= 2
            ),
        }
        for _, row in meta.iterrows()
    ]

    cpgs = []
    for index, cpg_id in enumerate(cpg_ids):
        coord = coords.loc[cpg_id] if cpg_id in coords.index else None
        ann = annotation.loc[cpg_id] if cpg_id in annotation.index else None
        cpgs.append(
            {
                "cpg_id": cpg_id,
                "panel_slot": index + 1,
                "chr": clean_text(coord["chr"]) if coord is not None else None,
                "pos": int(coord["pos"]) if coord is not None else None,
                "genome_build": "GRCh38",
                "panel_index": int(coord["panel_index"]) if coord is not None else None,
                "context": clean_text(coord["cg_context"]) if coord is not None else None,
                "island_relation": clean_text(ann["relation_to_island"]) if ann is not None else None,
                "island_locus": clean_text(ann["ucsc_cgi_name"]) if ann is not None else None,
                "promoter": clean_text(ann["promoter"]) if ann is not None else None,
                "genes": clean_text(ann["refgene_names"]) if ann is not None else None,
                "gene_groups": clean_text(ann["refgene_groups"]) if ann is not None else None,
                "total_variance": round(float(panel.iloc[index]["total_variance"]), 6),
            }
        )

    values = mean[cpg_ids].to_numpy(dtype="float32")
    quantised = np.rint(values * 1000).astype("int16")

    stats = []
    for index, cpg_id in enumerate(cpg_ids):
        column = values[:, index]
        stats.append(
            {
                "cpg_id": cpg_id,
                "mean": round(float(np.mean(column)), 4),
                "sd": round(float(np.std(column)), 4),
                "min": round(float(np.min(column)), 4),
                "p10": round(float(np.percentile(column, 10)), 4),
                "median": round(float(np.median(column)), 4),
                "p90": round(float(np.percentile(column, 90)), 4),
                "max": round(float(np.max(column)), 4),
                "n_groups": int(column.shape[0]),
            }
        )

    organ_rows = []
    for organ, frame in meta.groupby("organ_system"):
        weights = frame["n_cells"].to_numpy(dtype="float64")
        block = values[frame.index.to_numpy()]
        aggregate = (block * weights[:, None]).sum(axis=0) / weights.sum()
        organ_rows.append(
            {
                "label": organ,
                "n_groups": int(len(frame)),
                "n_cells": int(weights.sum()),
                "values": np.rint(aggregate * 1000).astype(int).tolist(),
            }
        )
    organ_rows.sort(key=lambda row: -row["n_cells"])

    top = meta.sort_values("n_cells", ascending=False).head(48)
    top_rows = [
        {
            "group_id": int(row["group_index"]),
            "label": f"{row['tissue']} · {row['cell_type']}",
            "n_cells": int(row["n_cells"]),
            "values": quantised[int(row["group_index"])].astype(int).tolist(),
        }
        for _, row in top.iterrows()
    ]

    manifest = pd.read_csv(SOURCE / "frozen_hash_manifest.tsv", sep="\t")
    weights = manifest[manifest["artifact"] == "fulls3_weights"].iloc[0]
    config = manifest[manifest["artifact"] == "fulls3_config"].iloc[0]

    release = {
        "data_mode": "pilot_predicted",
        "release_id": "pilot_3m_20261024",
        "prediction_type": "predicted_beta",
        "provenance_status": "pilot_aggregate",
        "generated_at": "2026-10-24",
        "n_cells_pilot": 3000000,
        "n_cells_in_groups": int(meta["n_cells"].sum()),
        "n_groups": int(len(meta)),
        "n_groups_high_confidence": int(
            ((meta.n_cells >= 100) & (meta.n_donors >= 3) & (meta.n_datasets >= 2)).sum()
        ),
        "n_tissues": int(meta["tissue"].nunique()),
        "n_cell_types": int(meta["cell_type"].nunique()),
        "n_organ_systems": int(meta["organ_system"].nunique()),
        "n_panel_probes": 485403,
        "n_profiled_cpgs": int(len(cpg_ids)),
        "aggregation": "mean_of_single_cell_predictions_per_tissue_x_cell_type",
        "checkpoint": {
            "artifact": weights["artifact"],
            "byte_size": int(weights["byte_size"]),
            "sha256": weights["sha256"],
            "config_sha256": config["sha256"],
        },
        "caveat": (
            "Predicted DNA methylation from Full-S3, aggregated by tissue and cell "
            "type. Not measured methylation. Pilot release covering 512 high-variance "
            "panel CpGs; the final pan-human atlas is not released."
        ),
    }

    write_json("release.json", release)
    write_json("groups.json", groups)
    write_json("cpgs.json", cpgs)
    write_json("cpg_stats.json", stats)
    write_json(
        "profile.json",
        {
            "scale": 1000,
            "cpg_ids": cpg_ids,
            "group_ids": [group["group_id"] for group in groups],
            "values": quantised.astype(int).tolist(),
        },
    )
    write_json(
        "heatmap.json",
        {"cpg_ids": cpg_ids, "organ_systems": organ_rows, "top_groups": top_rows},
    )


if __name__ == "__main__":
    main()
