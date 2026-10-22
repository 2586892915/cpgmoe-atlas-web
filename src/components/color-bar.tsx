export function BetaColorBar({
  label = "Predicted beta",
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-ink-faint">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="tabular text-[10px] text-ink-faint">0</span>
        <div
          className="viridis-bar h-2 w-32 border border-line sm:w-44"
          role="img"
          aria-label="Viridis colour scale from predicted beta 0 to 1"
        />
        <span className="tabular text-[10px] text-ink-faint">1</span>
      </div>
      <span className="text-[10px] text-ink-faint">Synthetic values</span>
    </div>
  );
}

export function DeltaColorBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] text-ink-faint">
        Δ predicted beta (B − A)
      </span>
      <div className="flex items-center gap-1.5">
        <span className="tabular text-[10px] text-ink-faint">−0.5</span>
        <div
          className="diverging-bar h-2 w-32 border border-line sm:w-44"
          role="img"
          aria-label="Diverging colour scale for delta predicted beta from minus 0.5 to plus 0.5"
        />
        <span className="tabular text-[10px] text-ink-faint">+0.5</span>
      </div>
      <span className="text-[10px] text-ink-faint">Synthetic comparison</span>
    </div>
  );
}
