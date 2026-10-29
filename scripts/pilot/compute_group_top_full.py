"""Rank the strongest CpGs for every tissue x cell-type group across all 485,403 CpGs."""

from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np

BASE = Path(
    "/data/home/5250028/zhangjianpeng/codex/"
    "CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
PROFILE = BASE / "07_query_demo/full_profiles/tissue_celltype_mean_u8.bin"
OUT = BASE / "07_query_demo/full_profiles/tissue_celltype_top30.json"

N_CPGS = 485_403
N_GROUPS = 2_093
BLOCK = 4_096
TOP_K = 30


def main() -> None:
    top_index = np.zeros((TOP_K, N_GROUPS), dtype=np.int32)
    top_delta = np.zeros((TOP_K, N_GROUPS), dtype=np.float32)
    panel_mean = np.empty(N_CPGS, dtype=np.float32)
    begin = time.time()

    with PROFILE.open("rb") as handle:
        for start in range(0, N_CPGS, BLOCK):
            width = min(BLOCK, N_CPGS - start)
            raw = np.frombuffer(handle.read(width * N_GROUPS), dtype=np.uint8)
            values = raw.reshape(width, N_GROUPS).astype(np.float32) / 255.0
            mean = values.mean(axis=1)
            panel_mean[start : start + width] = mean
            delta = values - mean[:, None]

            local = np.argpartition(-np.abs(delta), TOP_K - 1, axis=0)[:TOP_K]
            candidate_index = np.vstack([top_index, local + start])
            candidate_delta = np.vstack(
                [top_delta, np.take_along_axis(delta, local, axis=0)]
            )
            order = np.argsort(-np.abs(candidate_delta), axis=0)[:TOP_K]
            top_index = np.take_along_axis(candidate_index, order, axis=0)
            top_delta = np.take_along_axis(candidate_delta, order, axis=0)

    groups = []
    for group in range(N_GROUPS):
        items = []
        for rank in range(TOP_K):
            index = int(top_index[rank, group])
            deviation = float(top_delta[rank, group])
            beta = float(panel_mean[index] + deviation)
            items.append([index, round(beta, 4), round(deviation, 4)])
        groups.append({"group_index": group, "items": items})

    payload = {
        "n_groups": N_GROUPS,
        "n_cpgs": N_CPGS,
        "k": TOP_K,
        "reference": "mean_beta_across_2093_groups",
        "seconds": round(time.time() - begin, 1),
        "groups": groups,
    }
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({key: payload[key] for key in ("n_groups", "n_cpgs", "k", "seconds")}))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
