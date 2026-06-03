import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Corpus } from "../types";
import { VowelChart } from "./VowelChart";

const corpus: Corpus = {
  id: "test-corpus",
  version: "test",
  language: "Test English",
  languageCode: "en",
  description: "Test corpus",
  referenceSets: [{ id: "test", label: "Test" }],
  tokens: [
    {
      id: "heed",
      word: "heed",
      display: "heed",
      vowel: "FLEECE",
      ipa: "/i/",
      color: "#2166ac",
      analysis: {
        windowMs: 120,
        maxFormantHz: 5500,
        timeStep: 0.005
      },
      references: {
        test: {
          f1: 300,
          f2: 2500,
          ellipse: {
            semiMajorHz: 120,
            semiMinorHz: 60,
            angleDeg: -10,
            confidence: 0.68,
            n: 93,
            normalized: true,
            method: "speaker-lobanov-z-projected-to-corpus-average-hz",
            source: "test-source"
          }
        }
      }
    }
  ]
};

describe("VowelChart reference points", () => {
  it("renders normalized reference ranges as sampled paths", () => {
    const { container } = render(
      <VowelChart
        corpus={corpus}
        results={[]}
        selectedId={null}
        activeReferenceId="test"
        unit="hz"
        onSelect={() => undefined}
      />
    );

    expect(container.querySelector("ellipse")).toBeNull();
    expect(container.querySelector(".reference-ellipse")).not.toBeNull();
    expect(container.querySelector(".reference-point")).not.toBeNull();
  });
});
