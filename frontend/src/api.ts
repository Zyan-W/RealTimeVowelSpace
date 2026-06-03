import type { AnalyzeResponse, Corpus, CorpusToken } from "./types";

export async function fetchCorpora(): Promise<Corpus[]> {
  const response = await fetch("/api/corpora");
  if (!response.ok) {
    throw new Error("The analysis service is not ready. Start the backend and refresh this page.");
  }
  return response.json();
}

export async function fetchCorpus(): Promise<Corpus> {
  const response = await fetch("/api/corpus");
  if (!response.ok) {
    throw new Error("The word list could not be loaded. Start the backend and refresh this page.");
  }
  return response.json();
}

export async function analyzeToken(corpus: Corpus, token: CorpusToken, wavBlob: Blob): Promise<AnalyzeResponse> {
  const body = new FormData();
  body.append("corpus_id", corpus.id);
  body.append("word_id", token.id);
  body.append("vowel", token.vowel);
  body.append("audio", wavBlob, `${token.id}.wav`);

  const response = await fetch("/api/analyze-token", {
    method: "POST",
    body
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "The recording could not be analyzed. Check that the backend window is still running.");
  }

  return response.json();
}
