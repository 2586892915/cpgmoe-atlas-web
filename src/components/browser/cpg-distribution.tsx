import type { CellRecord, GroupSummary } from "@/lib/schemas";
import { syntheticBetaForCellAndCpg } from "@/mock/cells";

export function CpgDistribution({
  groups,
  cells,
  cpgId,
}: {
  groups: GroupSummary[];
  cells: CellRecord[];
  cpgId: string;
}) {
  const sorted = [...groups].sort(
    (a, b) => (b.mean_predicted_beta ?? -1) - (a.mean_predicted_beta ?? -1),
  );

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-[minmax(94px,130px)_1fr_54px_44px] items-center gap-2 border-b border-line pb-1.5 text-[10px] uppercase text-ink-faint">
        <span>Cell type</span>
        <span>Individual synthetic cells · mean marker</span>
        <span className="text-right">Mean</span>
        <span className="text-right">n</span>
      </div>
      <div className="divide-y divide-line">
        {sorted.map((group) => {
          const members = cells.filter((cell) => cell.cell_type === group.label);
          const step = Math.max(1, Math.floor(members.length / 16));
          const sampled = members.filter((_, index) => index % step === 0).slice(0, 16);
          const mean = group.mean_predicted_beta ?? 0;
          return (
            <div
              key={group.group_id}
              className="grid grid-cols-[minmax(94px,130px)_1fr_54px_44px] items-center gap-2 py-2"
            >
              <span className="truncate text-[12px] font-medium text-ink" title={group.label}>
                {group.label}
              </span>
              <span className="relative block h-5 bg-paper-tint" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 w-px bg-line-strong" />
                <span className="absolute inset-y-0 right-0 w-px bg-line-strong" />
                {sampled.map((cell, index) => {
                  const beta = syntheticBetaForCellAndCpg(cell.cell_id, cpgId);
                  return (
                    <span
                      key={cell.cell_id}
                      className="absolute h-1.5 w-1.5 rounded-full bg-rna/55"
                      style={{
                        left: `calc(${beta * 100}% - 3px)`,
                        top: 4 + (index % 3) * 4,
                      }}
                    />
                  );
                })}
                <span
                  className="absolute top-0 h-5 w-[2px] bg-primary"
                  style={{ left: `calc(${mean * 100}% - 1px)` }}
                />
                <span
                  className="absolute h-2.5 w-2.5 rounded-full border border-white bg-primary"
                  style={{ left: `calc(${mean * 100}% - 5px)`, top: 5 }}
                />
              </span>
              <span className="tabular text-right text-[12px] font-medium text-ink">
                {mean.toFixed(3)}
              </span>
              <span className="tabular text-right text-[11px] text-ink-faint">
                {group.n_cells}
              </span>
            </div>
          );
        })}
      </div>
      <p className="pt-2 text-[10px] leading-relaxed text-ink-faint">
        Dots are up to 16 sampled synthetic cells per group; the vertical marker
        is the group mean. No statistical test is performed.
      </p>
    </div>
  );
}
