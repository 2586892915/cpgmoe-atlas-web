"""Parallel, block-wise aggregation of tissue x cell type means (2,093 groups).

Runs on a fat compute node. Each worker owns a block of 4,096 CpGs and scans all
1,465 shards for that block (chunk-aligned), accumulating a (2,093, 4,096) sum.
Output is uint8, CpG-major: 485,403 x 2,093 bytes = 1.016 GB.
"""

from __future__ import annotations

import json
import multiprocessing as mp
import os
import time
from pathlib import Path

import h5py
import numpy as np
import pandas as pd

ROOT = Path(
    "/data/home/5250028/zhangjianpeng/codex/"
    "CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
MATRIX = ROOT / "03_full450k_matrix" / "stage_g4_3m"
GROUP_TABLE = (
    ROOT
    / "06_scientific_diagnostics/requested_small_aggregates/tissue_celltype_group_metadata.parquet"
)
OUT = Path(
    os.environ.get(
        "TC_OUT",
        ROOT / "07_query_demo/full_profiles/tissue_celltype_mean_u8.bin",
    )
)
BLOCK = 4096
TARGET_CELLS = 3_000_000
BLOCK_CELLS = 2048
WORKERS = int(os.environ.get("TC_WORKERS", "12"))
START_BLOCK = int(os.environ.get("TC_START_BLOCK", "0"))
MAX_SHARDS = int(os.environ.get("TC_MAX_SHARDS", "0")) or None
MAX_BLOCKS = int(os.environ.get("TC_MAX_BLOCKS", "0")) or None

SHARDS: list[tuple[str, np.ndarray, np.ndarray, np.ndarray]] = []
GROUP_OF_CELL: np.ndarray
COUNTS: np.ndarray
N_GROUPS: int
N_CPGS: int


def build_index() -> None:
    global GROUP_OF_CELL, COUNTS, N_GROUPS, N_CPGS
    metadata = pd.read_parquet(
        MATRIX / "cell_metadata_private.parquet",
        columns=["tissue", "cell_type"],
    ).iloc[:TARGET_CELLS]
    table = pd.read_parquet(GROUP_TABLE).sort_values("group_index")
    label_to_index = {
        key: index for index, key in enumerate(table["group_key"].tolist())
    }
    labels = (
        metadata["tissue"].fillna("UNKNOWN").astype(str)
        + "\t"
        + metadata["cell_type"].fillna("UNKNOWN").astype(str)
    )
    GROUP_OF_CELL = labels.map(label_to_index).fillna(-1).to_numpy(np.int32)
    N_GROUPS = len(table)
    COUNTS = np.bincount(GROUP_OF_CELL[GROUP_OF_CELL >= 0], minlength=N_GROUPS).astype(
        np.int64
    )

    panel = pd.read_csv(
        ROOT / "01_sample_and_panel/effective_full450k.tsv",
        sep="\t",
        usecols=["effective"],
    )
    N_CPGS = int(panel["effective"].astype(bool).sum())

    for start in range(0, TARGET_CELLS, BLOCK_CELLS):
        if MAX_SHARDS is not None and len(SHARDS) >= MAX_SHARDS:
            break
        end = min(start + BLOCK_CELLS, TARGET_CELLS)
        local_groups = GROUP_OF_CELL[start:end]
        keep = local_groups >= 0
        order = np.argsort(local_groups[keep], kind="stable")
        order = np.flatnonzero(keep)[order]
        ordered_groups = GROUP_OF_CELL[start + order]
        uniq, starts = np.unique(ordered_groups, return_index=True)
        SHARDS.append((f"cells_{start:09d}_{end:09d}.h5", order, uniq, starts))


def worker(task: tuple[int, int, int]) -> dict:
    block_index, cpg_start, cpg_end = task
    width = cpg_end - cpg_start
    sums = np.zeros((N_GROUPS, width), dtype=np.float64)
    begin = time.time()
    for name, order, uniq, starts in SHARDS:
        with h5py.File(MATRIX / name, "r", locking=False) as handle:
            values = handle["beta"][:, cpg_start:cpg_end].astype(np.float32)
        values = np.clip(values / 65535.0, 0.0, 1.0)
        ordered = values[order]
        sums[uniq] += np.add.reduceat(ordered, starts, axis=0)

    means = sums / np.maximum(COUNTS[:, None], 1)
    quantised = np.rint(means * 255.0).clip(0, 255).astype(np.uint8)
    payload = np.ascontiguousarray(quantised.T).tobytes()
    with open(OUT, "r+b") as sink:
        sink.seek(cpg_start * N_GROUPS)
        sink.write(payload)
    return {
        "block": block_index,
        "cpgs": [cpg_start, cpg_end],
        "seconds": round(time.time() - begin, 1),
    }


def main() -> None:
    build_index()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    expected_bytes = N_CPGS * N_GROUPS
    if START_BLOCK == 0:
        with open(OUT, "wb") as handle:
            handle.truncate(expected_bytes)
    elif not OUT.exists() or OUT.stat().st_size != expected_bytes:
        raise RuntimeError(
            f"cannot resume: {OUT} is missing or has the wrong size"
        )
    print(
        json.dumps(
            {
                "event": "init",
                "start_block": START_BLOCK,
                "groups": N_GROUPS,
                "cpgs": N_CPGS,
                "cells": int((GROUP_OF_CELL >= 0).sum()),
                "bytes": expected_bytes,
                "workers": WORKERS,
            }
        ),
        flush=True,
    )

    tasks = [
        (index, start, min(start + BLOCK, N_CPGS))
        for index, start in enumerate(range(0, N_CPGS, BLOCK))
        if index >= START_BLOCK
    ]
    if MAX_BLOCKS is not None:
        tasks = tasks[:MAX_BLOCKS]
    with mp.get_context("fork").Pool(WORKERS, maxtasksperchild=1) as pool:
        for result in pool.imap_unordered(worker, tasks, chunksize=1):
            print(json.dumps({"event": "block", **result}), flush=True)
    print(json.dumps({"event": "done", "out": str(OUT)}), flush=True)


if __name__ == "__main__":
    main()
