import type { DisplayUnit } from "./types";

export function hzToBark(hz: number): number {
  return 26.81 / (1960 / hz + 1) - 0.53;
}

export function displayValue(hz: number | null, unit: DisplayUnit): number | null {
  if (hz == null) return null;
  return unit === "bark" ? hzToBark(hz) : hz;
}

export function formatFormant(hz: number | null, unit: DisplayUnit): string {
  const value = displayValue(hz, unit);
  if (value == null) return "n/a";
  return unit === "bark" ? `${value.toFixed(2)} Bark` : `${value.toFixed(0)} Hz`;
}

export function unitLabel(unit: DisplayUnit): string {
  return unit === "bark" ? "Bark" : "Hz";
}
