import { AUDIT_STATE_LABEL } from "@/lib/data-mode";

export function DemoValue({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase text-ink-faint">{label}</p>
      <p className={`tabular font-semibold text-ink ${compact ? "text-xl" : "text-2xl"}`}>
        —
      </p>
      <p className="text-[11px] text-warm">{AUDIT_STATE_LABEL}</p>
    </div>
  );
}
