"""Verify the full tissue x cell-type uint8 profile against the 512-CpG reference panel."""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(
    "/data/home/5250028/zhangjianpeng/codex/"
    "CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
PROFILE = BASE / "07_query_demo/full_profiles/tissue_celltype_mean_u8.bin"
GROUPS = (
    BASE
    / "06_scientific_diagnostics/requested_small_aggregates/"
    "tissue_celltype_group_metadata.parquet"
)
REFERENCE = (
    BASE
    / "06_scientific_diagnostics/requested_small_aggregates/"
    "tissue_celltype_high_variance_mean.parquet"
)
PANEL = BASE / "03_full450k_matrix/stage_g4_3m/panel_manifest.tsv"
GLOBAL_MEAN = BASE / "tmp/all_cell_embedding/global_cpg_mean.npy"

N_CPGS = 485_403
MAX_CPG = int(os.environ.get("TC_MAX_CPG", "0")) or N_CPGS


def main() -> None:
    groups = pd.read_parquet(GROUPS).sort_values("group_index").reset_index(drop=True)
    n_groups = len(groups)
    assert n_groups == 2_093, n_groups
    assert groups["group_key"].is_unique
    assert groups["group_index"].tolist() == list(range(n_groups))

    expected_bytes = N_CPGS * n_groups
    actual_bytes = PROFILE.stat().st_size
    assert actual_bytes == expected_bytes, (actual_bytes, expected_bytes)

    reference = pd.read_parquet(REFERENCE)
    reference = reference.loc[groups["group_key"]]
    panel = pd.read_csv(PANEL, sep="\t", usecols=["probe_id"])
    index_of = {probe_id: index for index, probe_id in enumerate(panel["probe_id"])}

    errors = []
    quantized = {}
    with PROFILE.open("rb") as handle:
        for probe_id in reference.columns:
            cpg_index = index_of[probe_id]
            if cpg_index >= MAX_CPG:
                continue
            handle.seek(cpg_index * n_groups)
            raw = np.frombuffer(handle.read(n_groups), dtype=np.uint8)
            assert raw.size == n_groups
            values = raw.astype(np.float32) / 255.0
            quantized[probe_id] = values
            errors.append(np.abs(values - reference[probe_id].to_numpy(np.float32)))

    errors = np.concatenate(errors)
    global_mean = np.load(GLOBAL_MEAN)
    counts = groups["n_cells"].to_numpy(np.float64)

    weighted_diffs = {}
    checked = [probe_id for probe_id in reference.columns if probe_id in quantized]
    for probe_id in checked[:64]:
        values = quantized[probe_id].astype(np.float64)
        weighted = float(np.dot(values, counts) / counts.sum())
        weighted_diffs[probe_id] = weighted - float(global_mean[index_of[probe_id]])
    diff_values = np.array(list(weighted_diffs.values()))

    summary = {
        "n_groups": n_groups,
        "n_cpgs": N_CPGS,
        "file_bytes": actual_bytes,
        "cells_covered": int(counts.sum()),
        "reference_cpgs_checked": int(len(quantized)),
        "max_abs_quantization_error": float(errors.max()),
        "mean_abs_quantization_error": float(errors.mean()),
        "weighted_vs_global_max_abs_diff": float(np.abs(diff_values).max()),
        "weighted_vs_global_mean_abs_diff": float(np.abs(diff_values).mean()),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
