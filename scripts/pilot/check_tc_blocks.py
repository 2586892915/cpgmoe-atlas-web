"""Check which tissue x cell-type aggregation blocks are present and written."""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np

BASE = Path(
    "/data/home/5250028/zhangjianpeng/codex/"
    "CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
LOG = Path(os.environ.get("TC_LOG", BASE / "logs/tc_agg2_stdout.log"))
PROFILE = BASE / "07_query_demo/full_profiles/tissue_celltype_mean_u8.bin"
N_GROUPS = 2_093
N_CPGS = 485_403
BLOCK = 4_096


def main() -> None:
    events = []
    for line in LOG.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("event") == "block":
            events.append(event)
    blocks = sorted(event["block"] for event in events)
    missing = [index for index in range(119) if index not in set(blocks)]

    empty = []
    with PROFILE.open("rb") as handle:
        for index in blocks:
            start = index * BLOCK
            width = min(BLOCK, N_CPGS - start)
            handle.seek(start * N_GROUPS)
            sample = np.frombuffer(handle.read(min(width, 64) * N_GROUPS), dtype=np.uint8)
            if not sample.any():
                empty.append(index)

    print(
        json.dumps(
            {
                "blocks": len(blocks),
                "last": blocks[-1] if blocks else None,
                "missing": missing[:20],
                "n_missing": len(missing),
                "empty_blocks": empty,
                "bytes": PROFILE.stat().st_size,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
