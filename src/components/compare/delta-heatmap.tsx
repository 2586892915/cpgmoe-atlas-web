import type { CellRecord } from "@/lib/schemas";
import { meanBetaForCells } from "@/mock/methylation";

function deltaColor(delta: number | null): { background: string; color: string } {
  if (delta === null) {
    return { background: "#F4F8F9", color: "#6B7F88" };
  }
  const clamped = Math.max(-0.5, Math.min(0.5, delta));
  if (clamped < 0) {
    const intensity = Math.abs(clamped) / 0.5;
    const lightness = 96 - intensity * 42;
    return {
      background: `hsl(214 38% ${lightness}%)`,
      color: intensity > 0.55 ? "#FFFFFF" : "#17262E",
    };
  }
  if (clamped > 0) {
    const intensity = clamped / 0.5;
    const lightness = 96 - intensity * 40;
    return {
      background: `hsl(38 52% ${lightness}%)`,
      color: intensity > 0.55 ? "#FFFFFF" : "#17262E",
    };
  }
  return { background: "#F7F9F9", color: "#6B7F88" };
}

export function DeltaHeatmap({
  cpgIds,
  cellTypes,
  cellsA,
  cellsB,
}: {
  cpgIds: string[];
  cellTypes: string[];
  cellsA: CellRecord[];
  cellsB: CellRecord[];
}) {
  const columns = cellTypes.slice(0, 8);
  return (
    <div className="overflow-x-auto px-4 py-3">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">
          Delta predicted beta between group B and group A by CpG and cell type.
          Synthetic demonstration values with no statistical test.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-[120px] border-b border-line bg-paper-tint px-2 py-1.5 text-[10px] font-semibold uppercase text-ink-soft"
            >
              CpG
            </th>
            {columns.map((cellType) => (
              <th
                key={cellType}
                scope="col"
                className="border-b border-l border-line bg-paper-tint px-1.5 py-1.5 text-center text-[10px] font-semibold text-ink-soft"
              >
                {cellType}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cpgIds.map((cpgId) => (
            <tr key={cpgId}>
              <th
                scope="row"
                className="border-b border-line px-2 py-1 text-left text-[10px] font-medium text-ink"
              >
                {cpgId}
              </th>
              {columns.map((cellType) => {
                const groupA = cellsA.filter((cell) => cell.cell_type === cellType);
                const groupB = cellsB.filter((cell) => cell.cell_type === cellType);
                const a = meanBetaForCells(groupA, cpgId);
                const b = meanBetaForCells(groupB, cpgId);
                const delta = a !== null && b !== null ? Math.round((b - a) * 1000) / 1000 : null;
                const style = deltaColor(delta);
                return (
                  <td
                    key={cellType}
                    className="border-b border-l border-line px-1 py-2.5 text-center align-middle"
                    style={style}
                    title={
                      delta === null
                        ? `${cpgId} · ${cellType}: group missing`
                        : `${cpgId} · ${cellType}: Δ ${delta.toFixed(3)}`
                    }
                  >
                    <span className="tabular text-[11px] font-medium">
                      {delta === null ? "—" : delta.toFixed(2)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-2 text-[10px] leading-relaxed text-ink-faint">
        Cell types absent from either group are shown as “—”. No p-values, FDR,
        or DMR calls are generated; the heatmap is a layout demonstration.
      </p>
    </div>
  );
}
