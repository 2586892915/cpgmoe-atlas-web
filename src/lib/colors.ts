const VIRIDIS_STOPS: Array<[number, string]> = [
  [0, "#440154"],
  [0.14, "#46327e"],
  [0.28, "#365c8d"],
  [0.42, "#277f8e"],
  [0.57, "#1fa187"],
  [0.71, "#4ac16d"],
  [0.85, "#a0da39"],
  [1, "#fde725"],
];

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const channel = (index: number) =>
    Math.round(a[index] + (b[index] - a[index]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export function viridis(value: number): string {
  const clamped = Math.min(1, Math.max(0, value));
  for (let i = 0; i < VIRIDIS_STOPS.length - 1; i += 1) {
    const [start, startHex] = VIRIDIS_STOPS[i];
    const [end, endHex] = VIRIDIS_STOPS[i + 1];
    if (clamped >= start && clamped <= end) {
      const local = end === start ? 0 : (clamped - start) / (end - start);
      return mix(hexToRgb(startHex), hexToRgb(endHex), local);
    }
  }
  return VIRIDIS_STOPS[VIRIDIS_STOPS.length - 1][1];
}

export const CATEGORICAL_COLORS = [
  "#0072B2",
  "#009E73",
  "#E69F00",
  "#CC79A7",
  "#56B4E9",
  "#D55E00",
  "#8C6D31",
  "#7570B3",
  "#5F6B6D",
];

export function categoricalColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

export function colorForCategory(
  value: string,
  categories: string[],
): string {
  const index = Math.max(0, categories.indexOf(value));
  return categoricalColor(index);
}
