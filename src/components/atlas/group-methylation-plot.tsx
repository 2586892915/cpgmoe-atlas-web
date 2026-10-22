"use client";

import type { GroupSummary } from "@/lib/schemas";

export function GroupMethylationPlot({
  groups,
  selectedCellTypes,
  onSelectGroup,
}: {
  groups: GroupSummary[];
  selectedCellTypes: Set<string>;
  onSelectGroup: (cellType: string) => void;
}) {
  const sorted = [...groups].sort(
    (a, b) => (b.mean_predicted_beta ?? -1) - (a.mean_predicted_beta ?? -1),
  );

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-[minmax(92px,130px)_1fr_58px_44px] items-center gap-2 border-b border-line pb-1.5 text-[10px] uppercase text-ink-faint">
        <span>Group</span>
        <span>Mean predicted β</span>
        <span className="text-right">β</span>
        <span className="text-right">Cells</span>
      </div>
      <div className="divide-y divide-line">
        {sorted.map((group) => {
          const mean = group.mean_predicted_beta ?? 0;
          const active = selectedCellTypes.has(group.label);
          return (
            <button
              key={group.group_id}
              type="button"
              onClick={() => onSelectGroup(group.label)}
              aria-pressed={active}
              className={`grid w-full grid-cols-[minmax(92px,130px)_1fr_58px_44px] items-center gap-2 py-2 text-left transition-colors ${
                active ? "bg-primary-wash" : "hover:bg-paper-tint"
              }`}
            >
              <span className="truncate text-[12px] font-medium text-ink" title={group.label}>
                {group.label}
              </span>
              <span className="relative block h-3.5 bg-paper-deep" aria-hidden="true">
                <span
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{ width: `${mean * 100}%` }}
                />
                <span className="absolute inset-y-0 left-0 w-px bg-ink/30" />
              </span>
              <span className="tabular text-right text-[12px] font-medium text-ink">
                {mean.toFixed(3)}
              </span>
              <span className="tabular text-right text-[11px] text-ink-faint">
                {group.n_cells}
              </span>
            </button>
          );
        })}
      </div>
      <p className="pt-2 text-[10px] leading-relaxed text-ink-faint">
        Group means of synthetic cell-level predictions. No confidence
        intervals, p-values, or DMR calls are produced.
      </p>
    </div>
  );
}
