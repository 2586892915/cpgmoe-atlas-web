import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoricalColor, viridis } from "@/lib/colors";

const UMAP_CLUSTERS: Array<[number, number, string]> = [
  [64, 54, "Epithelial"],
  [142, 44, "T cell"],
  [112, 94, "Macrophage"],
  [186, 88, "Fibroblast"],
  [52, 106, "Endothelial"],
];

function MiniUmap() {
  return (
    <svg
      viewBox="0 0 240 150"
      className="h-full w-full"
      role="img"
      aria-label="Synthetic UMAP preview with five cell-type clusters"
    >
      <rect x="0" y="0" width="240" height="150" fill="#FCFDFD" />
      {[40, 80, 120, 160, 200].map((x) => (
        <line key={x} x1={x} y1="8" x2={x} y2="142" stroke="#EAF1F3" strokeWidth="1" />
      ))}
      {[36, 72, 108].map((y) => (
        <line key={y} x1="8" y1={y} x2="232" y2={y} stroke="#EAF1F3" strokeWidth="1" />
      ))}
      {UMAP_CLUSTERS.map(([cx, cy, label], clusterIndex) =>
        Array.from({ length: 13 }).map((_, index) => {
          const angle = index * 2.4 + clusterIndex;
          const radius = 4 + (index % 5) * 2.6;
          return (
            <circle
              key={`${label}-${index}`}
              cx={cx + Math.cos(angle) * radius}
              cy={cy + Math.sin(angle * 1.17) * radius * 0.78}
              r={1.6}
              fill={categoricalColor(clusterIndex)}
              opacity={0.82}
            />
          );
        }),
      )}
      <text x="8" y="146" fontSize="6" fill="#6B7F88">
        UMAP-1 (synthetic)
      </text>
      <text
        x="8"
        y="80"
        fontSize="6"
        fill="#6B7F88"
        transform="rotate(-90 8 80)"
      >
        UMAP-2
      </text>
    </svg>
  );
}

function MiniHeatmap() {
  const rows = 5;
  const columns = 9;
  return (
    <div className="flex h-full flex-col justify-center px-3 py-2">
      <svg
        viewBox="0 0 240 118"
        className="w-full"
        role="img"
        aria-label="Synthetic CpG by group methylation heatmap preview"
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: columns }).map((__, column) => {
            const value = ((row * 7 + column * 3 + 2) % 13) / 12;
            return (
              <rect
                key={`${row}-${column}`}
                x={8 + column * 24.5}
                y={8 + row * 19}
                width="22.5"
                height="17"
                fill={viridis(0.12 + value * 0.8)}
                stroke="#FCFDFD"
                strokeWidth="1"
              />
            );
          }),
        )}
        <text x="8" y="114" fontSize="6" fill="#6B7F88">
          CpG panel (synthetic)
        </text>
      </svg>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[8px] text-ink-faint">0</span>
        <div className="viridis-bar h-1.5 flex-1 border border-line" />
        <span className="text-[8px] text-ink-faint">1</span>
        <span className="text-[8px] text-ink-faint">β</span>
      </div>
    </div>
  );
}

function MiniTrack() {
  return (
    <svg
      viewBox="0 0 240 150"
      className="h-full w-full"
      role="img"
      aria-label="Synthetic genome browser track preview"
    >
      <rect x="0" y="0" width="240" height="150" fill="#FCFDFD" />
      <line x1="16" y1="38" x2="224" y2="38" stroke="#B9C9CE" />
      {[16, 68, 120, 172, 224].map((x) => (
        <g key={x}>
          <line x1={x} y1="34" x2={x} y2="42" stroke="#6B7F88" />
          <text x={x} y="28" textAnchor="middle" fontSize="5.5" fill="#6B7F88">
            {(7.66 + (x - 16) / 1000).toFixed(2)} Mb
          </text>
        </g>
      ))}
      <line x1="16" y1="38" x2="224" y2="38" stroke="#B9C9CE" />
      <rect x="46" y="52" width="36" height="12" fill="#5065A8" opacity="0.85" />
      <rect x="94" y="52" width="24" height="12" fill="#5065A8" opacity="0.85" />
      <rect x="132" y="52" width="48" height="12" fill="#5065A8" opacity="0.85" />
      <rect x="190" y="52" width="22" height="12" fill="#5065A8" opacity="0.85" />
      <text x="16" y="82" fontSize="7" fontWeight="600" fill="#5065A8">
        TP53 (demo model)
      </text>
      {[62, 104, 148, 198].map((x, index) => (
        <g key={x}>
          <line x1={x} y1="42" x2={x} y2={96 + (index % 2) * 10} stroke="#158F80" />
          <circle cx={x} cy={96 + (index % 2) * 10} r="3.2" fill="#158F80" />
        </g>
      ))}
      <text x="16" y="132" fontSize="6" fill="#6B7F88">
        Illustrative window · no experimental track
      </text>
    </svg>
  );
}

const TEASERS = [
  {
    href: "/atlas",
    label: "Cell Atlas",
    description: "Embedding, cell-type colouring, and group methylation.",
    chart: <MiniUmap />,
  },
  {
    href: "/browser",
    label: "Gene & CpG Browser",
    description: "Search a gene, probe ID, or GRCh38 interval.",
    chart: <MiniTrack />,
  },
  {
    href: "/compare",
    label: "Group Comparison",
    description: "Δ predicted β layout with no inferential claims.",
    chart: <MiniHeatmap />,
  },
];

export function VisualTeaser() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TEASERS.map((teaser) => (
        <Link
          key={teaser.href}
          href={teaser.href}
          className="group panel overflow-hidden transition-colors hover:border-primary/40"
        >
          <div className="relative h-[150px] border-b border-line bg-paper-tint">
            {teaser.chart}
            <span className="absolute right-2 top-2">
              <Badge tone="primary" dot>
                Synthetic preview
              </Badge>
            </span>
          </div>
          <div className="flex items-start justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">{teaser.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">
                {teaser.description}
              </p>
            </div>
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
