import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "rna" | "dna" | "warm" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-line bg-paper-tint text-ink-soft",
  primary: "border-primary/25 bg-primary-wash text-primary-dark",
  rna: "border-rna/25 bg-rna-wash text-rna",
  dna: "border-dna/25 bg-dna-wash text-dna",
  warm: "border-warm/30 bg-warm-wash text-warm",
  muted: "border-line bg-white text-ink-faint",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${TONE_CLASSES[tone]} ${className}`}
      style={{ borderRadius: 3 }}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  synthetic_demo: "Synthetic demo",
  metadata_only: "Indexed",
  rna_qc_passed: "RNA-QC passed",
  encoded: "Encoded",
  predicted: "Predicted",
  restricted: "Restricted",
  excluded: "Excluded",
};

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "rna_qc_passed"
      ? "rna"
      : status === "encoded"
        ? "dna"
        : status === "predicted"
          ? "primary"
          : status === "restricted" || status === "excluded"
            ? "warm"
            : "neutral";
  return (
    <Badge tone={tone} dot>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
