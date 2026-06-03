import type { DisplayUnit, ResultRow } from "./types";
import { displayValue } from "./units";

export function sessionResultsToCsv(results: ResultRow[], unit: DisplayUnit = "hz"): string {
  const unitName = unit === "bark" ? "bark" : "hz";
  const header = ["corpus", "word", "vowel", "ipa", `f1_${unitName}`, `f2_${unitName}`, `f3_${unitName}`, "confidence", "warnings", "timestamp"];
  const rows = results.map((row) =>
    [
      row.corpusId,
      row.word,
      row.vowel,
      row.ipa,
      formatCsvNumber(displayValue(row.f1, unit)),
      formatCsvNumber(displayValue(row.f2, unit)),
      formatCsvNumber(displayValue(row.f3, unit)),
      row.confidence,
      row.warnings.join(";"),
      row.timestamp
    ].map(csvCell).join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function formatCsvNumber(value: number | null): string {
  if (value == null) return "";
  return Number(value.toFixed(3)).toString();
}

export function csvCell(value: string | number): string {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}
