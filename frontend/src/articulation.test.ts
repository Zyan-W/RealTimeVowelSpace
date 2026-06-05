import { describe, expect, it } from "vitest";

import { deriveArticulationEstimate } from "./articulation";
import type { ResultRow } from "./types";

function row(overrides: Partial<ResultRow>): ResultRow {
  return {
    wordId: "token",
    corpusId: "american-english",
    word: "token",
    vowel: "DRESS",
    ipa: "/e/",
    f1: 600,
    f2: 1800,
    f3: 2600,
    duration: 0.7,
    confidence: 0.82,
    warnings: [],
    extractionWindow: { start: 0.2, end: 0.32, midpoint: 0.26 },
    timestamp: "2026-06-05T00:00:00.000Z",
    color: "#5aae61",
    ...overrides
  };
}

describe("deriveArticulationEstimate", () => {
  it("maps a high front vowel to a raised, front tongue with a small jaw opening", () => {
    const estimate = deriveArticulationEstimate(row({ vowel: "FLEECE", ipa: "/i/", f1: 300, f2: 2550 }));

    expect(estimate.tongueHeight).toBeGreaterThan(0.9);
    expect(estimate.tongueFrontness).toBeGreaterThan(0.9);
    expect(estimate.jawOpen).toBeLessThan(0.1);
    expect(estimate.lipRounding).toBeLessThan(0.2);
  });

  it("maps a back rounded vowel to a low-frontness, rounded estimate", () => {
    const estimate = deriveArticulationEstimate(row({ vowel: "GOOSE", ipa: "/u/", f1: 350, f2: 900, f3: 2200 }));

    expect(estimate.tongueFrontness).toBeLessThan(0.15);
    expect(estimate.lipRounding).toBeGreaterThan(0.7);
    expect(estimate.tractShape).toBeGreaterThan(0.7);
  });

  it("maps an open vowel to a wide jaw and low tongue body", () => {
    const estimate = deriveArticulationEstimate(row({ vowel: "a", ipa: "/a/", f1: 900, f2: 1200 }));

    expect(estimate.jawOpen).toBeGreaterThan(0.9);
    expect(estimate.tongueHeight).toBeLessThan(0.1);
  });

  it("falls back to a neutral shape when F1 or F2 is missing", () => {
    const estimate = deriveArticulationEstimate(row({ f1: null, f2: 1200, confidence: 0.44 }));

    expect(estimate.jawOpen).toBe(0.5);
    expect(estimate.tongueFrontness).toBe(0.5);
    expect(estimate.tongueHeight).toBe(0.5);
    expect(estimate.confidence).toBe(0.44);
  });

  it("clamps extreme values and keeps the analyzer confidence", () => {
    const estimate = deriveArticulationEstimate(row({ f1: 1400, f2: 10000, f3: -100, confidence: 1.4 }));
    const values = [estimate.jawOpen, estimate.tongueFrontness, estimate.tongueHeight, estimate.lipRounding, estimate.tractShape, estimate.confidence];

    expect(values.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(estimate.confidence).toBe(1);
  });
});
