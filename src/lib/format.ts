export function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

export function count(value: number): string {
  return value.toLocaleString("en-US");
}
