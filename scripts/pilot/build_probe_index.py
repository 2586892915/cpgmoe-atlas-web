"""Build the full-panel probe index (485,403 probes) for search and annotation.

Input: full450k_cpg_variance.parquet from the offline 3M run.
Output: src/data/pilot/probes.json — compact rows, no per-group values.

Row layout:
  [probe_id, chr_idx, pos, genes, mean_x1000, variance_x100000,
   celltype_vf_x1000, island_idx, promoter_idx]
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd

SOURCE = Path(
    os.environ.get(
        "PILOT_PROBE_SOURCE",
        Path(__file__).resolve().parents[4]
        / "work"
        / "pilot-data"
        / "full450k_cpg_variance.parquet",
    )
)
OUT = Path(
    os.environ.get(
        "PILOT_PROBE_OUT",
        Path(__file__).resolve().parents[2] / "src" / "data" / "pilot",
    )
)


def clean(value) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "na"} else text


def main() -> None:
    frame = pd.read_parquet(
        SOURCE,
        columns=[
            "panel_index",
            "probe_id",
            "chr",
            "pos",
            "global_mean_beta",
            "total_variance",
            "celltype_variance_fraction",
            "relation_to_island",
            "refgene_names",
            "promoter",
        ],
    ).sort_values("panel_index")

    chromosomes = sorted({clean(value) for value in frame["chr"]} - {""})
    islands = sorted({clean(value) for value in frame["relation_to_island"]} - {""})
    promoters = sorted({clean(value) for value in frame["promoter"]} - {""})
    chr_index = {value: index for index, value in enumerate(chromosomes)}
    island_index = {value: index for index, value in enumerate(islands)}
    promoter_index = {value: index for index, value in enumerate(promoters)}

    rows = []
    for record in frame.itertuples(index=False):
        rows.append(
            [
                record.probe_id,
                chr_index.get(clean(record.chr), -1),
                int(record.pos),
                clean(record.refgene_names),
                round(float(record.global_mean_beta) * 1000),
                round(float(record.total_variance) * 100000),
                round(float(record.celltype_variance_fraction) * 1000),
                island_index.get(clean(record.relation_to_island), -1),
                promoter_index.get(clean(record.promoter), -1),
            ]
        )

    payload = {
        "n_probes": len(rows),
        "chr": chromosomes,
        "island": islands,
        "promoter": promoters,
        "rows": rows,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (OUT / "probes.json").write_text(text, encoding="utf-8")
    print(f"probes.json {len(text)/1024/1024:6.1f} MB · {len(rows):,} probes")


if __name__ == "__main__":
    main()
