import type { ResultRow } from "./types";

export function sessionResultsToCsv(results: ResultRow[]): string {
  const header = ["word", "vowel", "ipa", "f1", "f2", "f3", "confidence", "warnings", "timestamp"];
  const rows = results.map((row) =>
    [
      row.word,
      row.vowel,
      row.ipa,
      row.f1 ?? "",
      row.f2 ?? "",
      row.f3 ?? "",
      row.confidence,
      row.warnings.join(";"),
      row.timestamp
    ].map(csvCell).join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function csvCell(value: string | number): string {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}
