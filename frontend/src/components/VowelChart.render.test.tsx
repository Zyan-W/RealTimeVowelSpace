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
          f2: 2500
        }
      }
    }
  ]
};

describe("VowelChart reference points", () => {
  it("renders reference centers without statistical ellipses", () => {
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
    expect(container.querySelector(".reference-point")).not.toBeNull();
  });
});
