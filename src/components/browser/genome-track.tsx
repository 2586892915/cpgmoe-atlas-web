import type { CpgRecord, GeneRecord } from "@/lib/schemas";
import { formatBp, formatRegion, toDisplayRange } from "@/lib/coordinate-utils";

export function GenomeTrack({
  chrom,
  start,
  end,
  items,
  gene,
  annotationWithheld,
}: {
  chrom: string | null;
  start: number | null;
  end: number | null;
  items: CpgRecord[];
  gene: GeneRecord | null;
  annotationWithheld: boolean;
}) {
  if (annotationWithheld || chrom === null || start === null || end === null) {
    return (
      <div className="flex min-h-[170px] flex-col items-center justify-center gap-2 px-6 py-8 text-center">
        <div className="flex h-10 w-full max-w-md items-center justify-center border border-dashed border-line-strong bg-paper-tint text-[11px] text-ink-faint">
          Genome track placeholder
        </div>
        <p className="text-[12px] font-medium text-ink">Annotation withheld in demo</p>
        <p className="max-w-md text-[11px] leading-relaxed text-ink-faint">
          The probe ID format is valid, but this prototype does not fabricate the
          probe&apos;s real hg38 coordinate. A production adapter must supply a
          curated annotation before a track is mounted.
        </p>
      </div>
    );
  }

  const span = Math.max(1, end - start);
  const xFor = (position: number) => 40 + ((position - start) / span) * 920;
  const display = toDisplayRange({ start, end });
  const geneWidth = gene ? gene.end - gene.start : 0;

  return (
    <div className="px-4 py-3">
      <svg
        viewBox="0 0 1000 142"
        role="img"
        aria-label={`Illustrative genome track for ${formatRegion(chrom, { start, end })}`}
        className="h-[142px] w-full"
      >
        <line x1="40" y1="36" x2="960" y2="36" stroke="#B9C9CE" strokeWidth="1" />
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const position = start + span * fraction;
          const x = 40 + fraction * 920;
          return (
            <g key={fraction}>
              <line x1={x} y1="31" x2={x} y2="41" stroke="#6B7F88" strokeWidth="1" />
              <text x={x} y="22" textAnchor="middle" fontSize="18" fill="#6B7F88">
                {formatBp(Math.round(position))}
              </text>
            </g>
          );
        })}
        <rect x="40" y="58" width="920" height="22" fill="#F4F8F9" stroke="#D7E2E5" />
        {gene ? (
          <>
            <rect
              x={xFor(gene.start)}
              y="62"
              width={Math.max(6, (geneWidth / span) * 920)}
              height="14"
              fill="#5065A8"
              opacity="0.8"
              rx="1"
            />
            <text
              x={Math.min(930, xFor(gene.start) + 6)}
              y="98"
              fontSize="16"
              fontWeight="600"
              fill="#5065A8"
            >
              {gene.gene_symbol} (demo model)
            </text>
          </>
        ) : null}
        {items.map((item, index) => {
          if (item.start === null || item.end === null) return null;
          const x = xFor((item.start + item.end) / 2);
          const y = 112 + (index % 2) * 10;
          return (
            <g key={item.cpg_id}>
              <line x1={x} y1="80" x2={x} y2={y - 3} stroke="#158F80" strokeWidth="0.8" />
              <circle cx={x} cy={y} r="3.4" fill="#158F80" />
              <text x={x} y={y + 12} textAnchor="middle" fontSize="14" fill="#3D535D">
                {item.cpg_id}
              </text>
            </g>
          );
        })}
        <text x="40" y="138" fontSize="15" fill="#6B7F88">
          Illustrative window · {chrom}:{formatBp(display.start)}–
          {formatBp(display.end)} (1-based inclusive) · no experimental track data
        </text>
      </svg>
    </div>
  );
}
