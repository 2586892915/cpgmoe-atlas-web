"""Export full 485,403-CpG group profiles as per-CpG contiguous uint8 blobs.

Runs on the cluster next to the offline 3M outputs:
  python export_full_profiles.py

Output (07_query_demo/full_profiles/):
  celltype_mean_u8.bin  569 x 485403, CpG-major
  tissue_mean_u8.bin    207 x 485403, CpG-major
  organ_mean_u8.bin      16 x 485403, CpG-major
  *_meta.json           group labels + support counts

Record layout: byte offset = panel_index * n_groups; n_groups bytes per CpG.
Values are round(beta * 255).
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import h5py
import numpy as np
import pandas as pd

PROJECT = Path(
    "/data/home/5250028/zhangjianpeng/codex/CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
PROFILES = PROJECT / "05_group_profiles"
OUT = PROJECT / "07_query_demo" / "full_profiles"
LEVELS = ["celltype", "tissue", "organ"]
BLOCK = 4096


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for level in LEVELS:
        profile_path = PROFILES / f"{level}_full450k" / "profiles.h5"
        meta_path = PROFILES / f"{level}_full450k" / "group_metadata.tsv"
        meta = pd.read_csv(meta_path, sep="\t")
        target = OUT / f"{level}_mean_u8.bin"

        digest = hashlib.sha256()
        with h5py.File(profile_path, "r") as handle:
            block_size = min(BLOCK, handle["mean"].shape[1])
            n_cpgs = handle["mean"].shape[1]
            with open(target, "wb") as sink:
                for start in range(0, n_cpgs, block_size):
                    block = handle["mean"][:, start : start + block_size]
                    quantised = np.rint(block * 255.0).clip(0, 255).astype(np.uint8)
                    payload = np.ascontiguousarray(quantised.T).tobytes()
                    sink.write(payload)
                    digest.update(payload)

        (OUT / f"{level}_meta.json").write_text(
            json.dumps(
                {
                    "level": level,
                    "n_groups": int(len(meta)),
                    "n_cpgs": int(n_cpgs),
                    "scale": 255,
                    "sha256": digest.hexdigest(),
                    "groups": json.loads(meta.to_json(orient="records")),
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(
            f"{level:9s} groups={len(meta):4d} bytes={target.stat().st_size:>12,} "
            f"sha256={digest.hexdigest()[:16]}"
        )


if __name__ == "__main__":
    main()
