import type { AnalyzeResponse, Corpus, CorpusToken } from "./types";

export async function fetchCorpus(): Promise<Corpus> {
  const response = await fetch("/api/corpus");
  if (!response.ok) {
    throw new Error("Could not load the word list.");
  }
  return response.json();
}

export async function analyzeToken(token: CorpusToken, wavBlob: Blob): Promise<AnalyzeResponse> {
  const body = new FormData();
  body.append("word_id", token.id);
  body.append("vowel", token.vowel);
  body.append("audio", wavBlob, `${token.id}.wav`);

  const response = await fetch("/api/analyze-token", {
    method: "POST",
    body
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "The backend could not analyze this recording.");
  }

  return response.json();
}
