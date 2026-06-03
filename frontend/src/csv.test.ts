import { describe, expect, it } from "vitest";

import { sessionResultsToCsv } from "./csv";
import type { ResultRow } from "./types";

it("exports session results as csv", () => {
  const rows: ResultRow[] = [
    {
      wordId: "head",
      corpusId: "american-english",
      word: "head",
      vowel: "DRESS",
      ipa: "/\u025b/",
      f1: 610,
      f2: 1900,
      f3: null,
      duration: 0.7,
      confidence: 0.88,
      warnings: ["low_level"],
      extractionWindow: { start: 0.2, end: 0.32, midpoint: 0.26 },
      timestamp: "2026-06-03T00:00:00.000Z",
      color: "#5aae61"
    }
  ];

  expect(sessionResultsToCsv(rows)).toContain("american-english,head,DRESS,/\u025b/,610,1900,,0.88,low_level");
  expect(sessionResultsToCsv(rows, "bark")).toContain("f1_bark");
});
