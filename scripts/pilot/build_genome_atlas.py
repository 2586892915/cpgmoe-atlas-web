"""Build a genome-ordered organ-system atlas from the full organ profile."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(
    "/data/home/5250028/zhangjianpeng/codex/"
    "CPGMoE_FullS3_3M_Full450K_PanTissue_20261022"
)
PROFILE = BASE / "07_query_demo/full_profiles/organ_mean_u8.bin"
PANEL = BASE / "03_full450k_matrix/stage_g4_3m/panel_manifest.tsv"
OUT = BASE / "07_query_demo/full_profiles/organ_genome_u8.bin"
BINS = BASE / "07_query_demo/full_profiles/organ_genome_bins_u8.bin"
CHR_BINS = BASE / "07_query_demo/full_profiles/organ_chr_bins_u8.bin"
META = BASE / "07_query_demo/full_profiles/organ_genome_meta.json"

N_BINS = 2_048
CHR_BIN_SIZE = 320


def main() -> None:
    panel = pd.read_csv(PANEL, sep="\t", usecols=["probe_id", "chr", "pos"])
    assert len(panel) == 485_403
    matrix = np.fromfile(PROFILE, dtype=np.uint8).reshape(len(panel), 16)
    canonical = {
        f"chr{index}": index for index in range(1, 23)
    } | {"chrX": 23, "chrY": 24}
    alt_names = sorted(set(panel["chr"]) - set(canonical))
    alt_rank = {name: 100 + index for index, name in enumerate(alt_names)}
    ranks = panel["chr"].map(
        lambda name: canonical[name] if name in canonical else alt_rank[name]
    )
    ranks = ranks.to_numpy(np.int32)
    order = np.lexsort(
        (
            np.arange(len(panel), dtype=np.int64),
            panel["pos"].to_numpy(np.int64),
            ranks,
        )
    )
    assert order.size == len(panel)
    ordered = matrix[order]
    ordered.tofile(OUT)

    edges = np.linspace(0, len(panel), N_BINS + 1).astype(np.int64)
    bins = np.empty((N_BINS, 16), dtype=np.uint8)
    for index in range(N_BINS):
        block = ordered[edges[index] : edges[index + 1]]
        bins[index] = np.rint(block.mean(axis=0)).clip(0, 255).astype(np.uint8)
    bins.tofile(BINS)

    ordered_panel = panel.iloc[order].reset_index(drop=True)
    chromosome_rows = []
    for name, group in ordered_panel.groupby("chr", sort=False):
        if name in canonical:
            chromosome_rows.append(
                {
                    "chr": name,
                    "start": int(group.index.min()),
                    "end": int(group.index.max()) + 1,
                    "n": int(len(group)),
                }
            )
    alt = ordered_panel[~ordered_panel["chr"].isin(canonical)]
    if len(alt):
        chromosome_rows.append(
            {
                "chr": "alt",
                "start": int(alt.index.min()),
                "end": int(alt.index.max()) + 1,
                "n": int(len(alt)),
            }
        )

    chr_bins = np.zeros((len(chromosome_rows), CHR_BIN_SIZE, 16), dtype=np.uint8)
    for index, entry in enumerate(chromosome_rows):
        block = ordered[entry["start"] : entry["end"]]
        width = min(CHR_BIN_SIZE, len(block))
        chr_edges = np.linspace(0, len(block), width + 1).astype(np.int64)
        for bin_index in range(width):
            section = block[chr_edges[bin_index] : chr_edges[bin_index + 1]]
            chr_bins[index, bin_index] = np.rint(section.mean(axis=0)).clip(
                0, 255
            ).astype(np.uint8)
    chr_bins.tofile(CHR_BINS)

    meta = {
        "n_cpgs": int(len(panel)),
        "n_bins": N_BINS,
        "n_organs": 16,
        "bin_edges": edges.tolist(),
        "chr_bin_size": CHR_BIN_SIZE,
        "first_cpg": str(ordered_panel.iloc[0]["probe_id"]),
        "last_cpg": str(ordered_panel.iloc[-1]["probe_id"]),
        "chromosomes": chromosome_rows,
        "bytes": OUT.stat().st_size,
        "bins_bytes": BINS.stat().st_size,
        "chr_bins_bytes": CHR_BINS.stat().st_size,
        "sha256": "",
    }
    META.write_text(json.dumps(meta, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({key: meta[key] for key in ("n_cpgs", "n_bins", "first_cpg", "last_cpg", "bytes")}))


if __name__ == "__main__":
    main()
