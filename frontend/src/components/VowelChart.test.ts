import { describe, expect, it } from "vitest";

import { orderPointsClockwise } from "./VowelChart";

describe("orderPointsClockwise", () => {
  it("orders points around their center without mutating the input", () => {
    const points = [
      { id: "bottom-right", x: 1, y: 1 },
      { id: "top-left", x: -1, y: -1 },
      { id: "bottom-left", x: -1, y: 1 },
      { id: "top-right", x: 1, y: -1 }
    ];

    const ordered = orderPointsClockwise(points);

    expect(ordered.map((point) => point.id)).toEqual(["top-left", "top-right", "bottom-right", "bottom-left"]);
    expect(points.map((point) => point.id)).toEqual(["bottom-right", "top-left", "bottom-left", "top-right"]);
  });
});
