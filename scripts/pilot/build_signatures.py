"""Build per-group signature CpGs from the full-panel uint8 matrices.

For every cell type / tissue, rank CpGs by |beta - global mean| among CpGs with
total_variance >= 0.005, keeping the top 40. Output feeds the cell-type and
tissue detail pages.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[4] / "work" / "pilot-data"
FULL = ROOT / "full"
OUT = Path(__file__).resolve().parents[2] / "src" / "data" / "pilot" / "signatures.json"

TOP_N = 40
GROUP_BLOCK = 100
MIN_VARIANCE = 0.005


def main() -> None:
    panel = pd.read_parquet(
        ROOT / "full450k_cpg_variance.parquet",
        columns=["panel_index", "probe_id", "refgene_names", "global_mean_beta", "total_variance"],
    ).sort_values("panel_index")

    means = panel["global_mean_beta"].to_numpy(dtype=np.float32)
    variance = panel["total_variance"].to_numpy(dtype=np.float32)
    probe_ids = panel["probe_id"].to_numpy()
    genes = panel["refgene_names"].fillna("").to_numpy()
    usable = variance >= MIN_VARIANCE
    n_cpgs = len(panel)

    output = {
        "release_id": "pilot_3m_20261024",
        "top_n": TOP_N,
        "min_variance": MIN_VARIANCE,
        "levels": {},
    }

    for level in ["celltype", "tissue"]:
        meta = json.loads((FULL / f"{level}_meta.json").read_text(encoding="utf-8"))
        groups = meta["groups"]
        n_groups = len(groups)
        matrix = np.memmap(
            FULL / f"{level}_mean_u8.bin", dtype=np.uint8, mode="r", shape=(n_cpgs, n_groups)
        )

        items = []
        for start in range(0, n_groups, GROUP_BLOCK):
            stop = min(n_groups, start + GROUP_BLOCK)
            block = matrix[:, start:stop].astype(np.float32) / 255.0
            delta = block - means[:, None]
            delta[~usable, :] = 0.0
            for offset in range(stop - start):
                group_index = start + offset
                column = delta[:, offset]
                top = np.argpartition(-np.abs(column), TOP_N)[:TOP_N]
                top = top[np.argsort(-np.abs(column[top]))]
                group = groups[group_index]
                items.append(
                    {
                        "group_index": group["group_index"],
                        "label": group["group_label"],
                        "n_cells": int(group["n_cells"]),
                        "n_donors": int(group["n_donors"]),
                        "n_datasets": int(group["n_datasets"]),
                        "supported": bool(group["n_cells"] >= 100),
                        "top": [
                            {
                                "cpg_id": str(probe_ids[index]),
                                "gene": str(genes[index]).split(";")[0] or None,
                                "beta": round(float(block[index, offset]), 4),
                                "delta": round(float(column[index]), 4),
                            }
                            for index in top
                        ],
                    }
                )

        output["levels"][level] = {"n_groups": n_groups, "items": items}
        supported = sum(1 for item in items if item["supported"])
        print(f"{level:9s} groups={n_groups} supported={supported}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(output, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(text, encoding="utf-8")
    print(f"signatures.json {len(text)/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()
