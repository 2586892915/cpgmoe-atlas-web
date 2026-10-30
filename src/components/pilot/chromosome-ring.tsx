"use client";

import { useMemo, useState } from "react";

export type ChromosomeEntry = {
  chr: string;
  n_cpgs: number;
  start: number;
  end: number;
  first_pos: number;
  last_pos: number;
};

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 132;
const GAP = 0.06;

const CHROMOSOME_LENGTH: Record<string, number> = {
  chr1: 248_956_422,
  chr2: 242_193_529,
  chr3: 198_295_559,
  chr4: 190_214_555,
  chr5: 181_538_259,
  chr6: 170_805_979,
  chr7: 159_345_973,
  chr8: 145_138_636,
  chr9: 138_394_717,
  chr10: 133_797_422,
  chr11: 135_086_622,
  chr12: 133_275_309,
  chr13: 114_364_328,
  chr14: 107_043_718,
  chr15: 101_991_189,
  chr16: 90_338_345,
  chr17: 83_257_441,
  chr18: 80_373_285,
  chr19: 58_617_616,
  chr20: 64_444_167,
  chr21: 46_709_983,
  chr22: 50_818_468,
  chrX: 156_040_895,
  chrY: 57_227_415,
};

function point(angle: number, radius: number) {
  return [
    CENTER + Math.cos(angle) * radius,
    CENTER + Math.sin(angle) * radius,
  ] as const;
}

function arc(start: number, end: number, radius: number) {
  const [x1, y1] = point(start, radius);
  const [x2, y2] = point(end, radius);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}

function prettyChromosome(name: string) {
  if (name === "alt") return "alt";
  return name.replace(/^chr/, "");
}

export function ChromosomeRing({
  chromosomes,
  selected,
  total,
  onSelect,
}: {
  chromosomes: ChromosomeEntry[];
  selected: string;
  total: number;
  onSelect: (chr: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const arcs = useMemo(() => {
    const weights = chromosomes.map((entry) =>
      entry.chr === "alt"
        ? 1
        : CHROMOSOME_LENGTH[entry.chr] ?? Math.max(1, entry.last_pos - entry.first_pos),
    );
    const usable = Math.PI * 2 - GAP * chromosomes.length;
    const sum = weights.reduce((value, weight) => value + weight, 0);
    let angle = -Math.PI / 2;
    return chromosomes.map((entry, index) => {
      const span = (weights[index] / sum) * usable;
      const start = angle;
      const end = angle + span;
      angle = end + GAP;
      return { entry, start, end };
    });
  }, [chromosomes]);

  const active = hovered ?? selected;
  const activeEntry = chromosomes.find((entry) => entry.chr === active);
  const shown =
    active === "all"
      ? { label: "Pan-tissue", n: total }
      : { label: active, n: activeEntry?.n_cpgs ?? 0 };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block w-full max-w-[320px]"
        role="group"
        aria-label="Chromosome selector"
      >
        <defs>
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="ring-center" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#F7FBFF" />
            <stop offset="100%" stopColor="#E8F0FB" />
          </radialGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={112} fill="url(#ring-center)" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={112}
          fill="none"
          stroke="#DCE7F5"
          strokeWidth={1}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#E3ECF7"
          strokeWidth={1}
          strokeDasharray="1 4"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - 18}
          fill="none"
          stroke="#EDF3FA"
          strokeWidth={1}
        />
        {arcs.map(({ entry, start, end }, index) => {
          const isActive = entry.chr === selected;
          const isHovered = entry.chr === hovered;
          return (
            <g key={entry.chr}>
              {isActive ? (
                <path
                  d={arc(start, end, RADIUS)}
                  fill="none"
                  stroke="rgba(217,106,31,0.14)"
                  strokeWidth={32}
                  strokeLinecap="butt"
                />
              ) : null}
              <path
                d={arc(start, end, RADIUS)}
                fill="none"
                stroke={
                  isActive
                    ? "#D96A1F"
                    : isHovered
                      ? "#156E86"
                    : `hsl(${204 + (index % 7) * 5} 42% ${index % 2 === 0 ? 54 : 62}%)`
                }
                strokeWidth={isActive ? 23 : isHovered ? 14 : 9}
                strokeLinecap="butt"
                className="cursor-pointer transition-[stroke,stroke-width,opacity] duration-150"
                onMouseEnter={() => setHovered(entry.chr)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(entry.chr)}
                role="button"
                tabIndex={0}
                aria-label={`${entry.chr}, ${entry.n_cpgs.toLocaleString("en-US")} CpGs`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(entry.chr);
                  }
                }}
              >
                <title>
                  {entry.chr} ·{" "}
                  {CHROMOSOME_LENGTH[entry.chr]
                    ? `${(CHROMOSOME_LENGTH[entry.chr] / 1_000_000).toFixed(1)} Mb`
                    : "alt contigs"}{" "}
                  · {entry.n_cpgs.toLocaleString("en-US")} CpGs
                </title>
              </path>
            </g>
          );
        })}
        {arcs.map(({ entry, start, end }) => {
          if (entry.chr === "alt") return null;
          const angle = (start + end) / 2;
          const [x, y] = point(angle, RADIUS + 25);
          const selectedLabel = entry.chr === selected;
          return (
            <text
              key={`label-${entry.chr}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={entry.n_cpgs < 1000 ? 6.5 : 8.5}
              fontWeight={selectedLabel ? 700 : 500}
              fill={selectedLabel ? "#B85F19" : "#7086A4"}
              className="pointer-events-none select-none"
            >
              {prettyChromosome(entry.chr)}
            </text>
          );
        })}
        {selected !== "all"
          ? arcs
              .filter(({ entry }) => entry.chr === selected)
              .map(({ entry, start, end }) => {
                const [x, y] = point((start + end) / 2, RADIUS + 14);
                return (
                  <circle
                    key={`marker-${entry.chr}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill="#D96A1F"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                );
              })
          : null}
        <text
          x={CENTER}
          y={CENTER - (shown.label === "Pan-tissue" ? 4 : 10)}
          textAnchor="middle"
          fontSize={shown.label === "Pan-tissue" ? 22 : 34}
          fontWeight="650"
          fill="#0B2A6F"
        >
          {shown.label}
        </text>
        <text
          x={CENTER}
          y={CENTER + (shown.label === "Pan-tissue" ? 22 : 24)}
          textAnchor="middle"
          fontSize="10"
          fill="#7086A4"
        >
          {shown.n.toLocaleString("en-US")} CpGs
        </text>
        <text
          x={CENTER}
          y={CENTER + (shown.label === "Pan-tissue" ? 38 : 42)}
          textAnchor="middle"
          fontSize="7.5"
          letterSpacing="0.08em"
          fill="#9AAAC0"
        >
          GRCh38
        </text>
        {shown.label === "Pan-tissue" ? (
          <text
            x={CENTER}
            y={CENTER + 10}
            textAnchor="middle"
            fontSize="10"
            fill="#7086A4"
          >
            all chromosomes
          </text>
        ) : null}
      </svg>
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`mx-auto mt-2 block text-[10px] underline decoration-primary/30 underline-offset-2 transition-colors ${
          selected === "all" ? "text-[#B85F19]" : "text-primary hover:decoration-primary"
        }`}
      >
        {selected === "all" ? "All chromosomes selected" : "View all chromosomes"}
      </button>
      <div className="mt-2 grid grid-cols-8 gap-1">
        {chromosomes.map((entry) => {
          const active = selected === entry.chr;
          return (
            <button
              key={`pill-${entry.chr}`}
              type="button"
              onClick={() => onSelect(entry.chr)}
              className={`border px-0.5 py-1 text-[9px] transition-colors ${
                active
                  ? "border-[#D9772A] bg-[#FFF4EA] text-[#B85F19]"
                  : "border-line bg-white text-ink-faint hover:border-primary/40 hover:text-ink-soft"
              }`}
              title={`${entry.chr} · ${entry.n_cpgs.toLocaleString("en-US")} CpGs`}
            >
              {prettyChromosome(entry.chr)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
