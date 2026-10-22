import type { GeneRecord } from "@/lib/schemas";
import { formatBp, toDisplayRange } from "@/lib/coordinate-utils";

const EXONS: Array<[number, number]> = [
  [0.06, 0.09],
  [0.22, 0.07],
  [0.38, 0.13],
  [0.6, 0.08],
  [0.76, 0.11],
  [0.9, 0.055],
];

export function GeneOverview({ gene }: { gene: GeneRecord }) {
  const display = toDisplayRange({ start: gene.start, end: gene.end });
  return (
    <div className="px-4 py-3">
      <svg
        viewBox="0 0 1000 130"
        role="img"
        aria-label={`Illustrative gene model for ${gene.gene_symbol} on ${gene.chrom}, demo only`}
        className="h-[130px] w-full"
      >
        <line x1="20" y1="64" x2="980" y2="64" stroke="#B9C9CE" strokeWidth="2" />
        <polygon points="960,56 980,64 960,72" fill="#B9C9CE" />
        {EXONS.map(([start, width], index) => (
          <rect
            key={index}
            x={20 + start * 960}
            y={46}
            width={width * 960}
            height={36}
            fill="#5065A8"
            rx="2"
          />
        ))}
        <text x="20" y="25" fontSize="24" fontWeight="600" fill="#17262E">
          {gene.gene_symbol}
        </text>
        <text x="20" y="41" fontSize="15" fill="#6B7F88">
          Illustrative demo transcript model · not a curated annotation
        </text>
        <text x="20" y="112" fontSize="15" fill="#6B7F88">
          {gene.chrom}:{formatBp(display.start)}–{formatBp(display.end)} (1-based inclusive)
        </text>
        <text x="980" y="112" fontSize="15" textAnchor="end" fill="#6B7F88">
          {gene.cpg_ids.length} demo panel CpG{gene.cpg_ids.length === 1 ? "" : "s"}
        </text>
        <g aria-hidden="true">
          {[0.3, 0.55, 0.8].map((fraction) => (
            <polyline
              key={fraction}
              points={`${20 + fraction * 960 - 8},56 ${20 + fraction * 960},64 ${
                20 + fraction * 960 - 8
              },72`}
              fill="none"
              stroke="#17262E"
              strokeWidth="1.2"
              opacity="0.45"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
