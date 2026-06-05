import { describe, expect, it } from "vitest";

import type { ArticulationEstimate } from "./articulation";
import { getArticulatoryGeometryParams } from "./articulationGeometry";

function estimate(overrides: Partial<ArticulationEstimate>): ArticulationEstimate {
  return {
    jawOpen: 0.5,
    tongueFrontness: 0.5,
    tongueHeight: 0.5,
    lipRounding: 0.25,
    tractShape: 0.5,
    confidence: 0.8,
    basis: "formant-heuristic-v1",
    ...overrides
  };
}

describe("getArticulatoryGeometryParams", () => {
  it("moves the tongue forward and upward for high front estimates", () => {
    const backLow = getArticulatoryGeometryParams(estimate({ tongueFrontness: 0.1, tongueHeight: 0.1 }));
    const frontHigh = getArticulatoryGeometryParams(estimate({ tongueFrontness: 0.95, tongueHeight: 0.95 }));

    expect(frontHigh.tongue.position[0]).toBeGreaterThan(backLow.tongue.position[0]);
    expect(frontHigh.tongue.position[1]).toBeGreaterThan(backLow.tongue.position[1]);
  });

  it("opens the jaw and tract radius as jawOpen increases", () => {
    const closed = getArticulatoryGeometryParams(estimate({ jawOpen: 0.05 }));
    const open = getArticulatoryGeometryParams(estimate({ jawOpen: 0.95 }));

    expect(open.jaw.lowerY).toBeLessThan(closed.jaw.lowerY);
    expect(open.tract.radius).toBeGreaterThan(closed.tract.radius);
  });

  it("protrudes and rounds the lips for rounded estimates", () => {
    const spread = getArticulatoryGeometryParams(estimate({ lipRounding: 0.05 }));
    const rounded = getArticulatoryGeometryParams(estimate({ lipRounding: 0.95 }));

    expect(rounded.lips.centerX).toBeGreaterThan(spread.lips.centerX);
    expect(rounded.lips.roundingScale).toBeGreaterThan(spread.lips.roundingScale);
    expect(rounded.tract.points.at(-1)?.[0]).toBeGreaterThan(spread.tract.points.at(-1)?.[0] ?? 0);
  });
});
