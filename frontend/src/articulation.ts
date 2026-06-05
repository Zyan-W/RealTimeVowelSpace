import type { ResultRow } from "./types";

export type ArticulationEstimate = {
  jawOpen: number;
  tongueFrontness: number;
  tongueHeight: number;
  lipRounding: number;
  tractShape: number;
  confidence: number;
  basis: "formant-heuristic-v1";
};

const NEUTRAL_ESTIMATE: ArticulationEstimate = {
  jawOpen: 0.5,
  tongueFrontness: 0.5,
  tongueHeight: 0.5,
  lipRounding: 0.25,
  tractShape: 0.5,
  confidence: 0,
  basis: "formant-heuristic-v1"
};

const ROUNDED_VOWEL_HINTS = [
  "GOOSE",
  "FOOT",
  "THOUGHT",
  "NORTH",
  "FORCE",
  "GOAT",
  "LOT",
  "CLOTH",
  "o",
  "u"
];

export function deriveArticulationEstimate(result: ResultRow | null): ArticulationEstimate {
  if (!result) return { ...NEUTRAL_ESTIMATE };

  const confidence = clamp01(result.confidence);
  if (!isUsableFormant(result.f1) || !isUsableFormant(result.f2)) {
    return { ...NEUTRAL_ESTIMATE, confidence };
  }

  const f1 = result.f1;
  const f2 = result.f2;
  const jawOpen = clamp01((f1 - 250) / 700);
  const tongueHeight = clamp01(1 - (f1 - 250) / 650);
  const tongueFrontness = clamp01((f2 - 750) / 1850);
  const f2Lowering = clamp01((1500 - f2) / 700);
  const lipRounding = clamp01(0.58 * f2Lowering + 0.32 * roundedVowelHint(result) + 0.1 * (1 - jawOpen));
  const tractShape = isUsableFormant(result.f3)
    ? clamp01((3200 - result.f3) / 1200)
    : clamp01(0.55 * (1 - tongueFrontness) + 0.45 * lipRounding);

  return {
    jawOpen,
    tongueFrontness,
    tongueHeight,
    lipRounding,
    tractShape,
    confidence,
    basis: "formant-heuristic-v1"
  };
}

function roundedVowelHint(result: ResultRow): number {
  const vowel = result.vowel.toLowerCase();
  const ipa = result.ipa.toLowerCase();
  if (ROUNDED_VOWEL_HINTS.some((hint) => vowel.includes(hint.toLowerCase()))) return 1;
  if (/[uoɔʊ]/u.test(ipa)) return 1;
  return 0;
}

function isUsableFormant(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
