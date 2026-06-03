export type AnalysisHints = {
  windowMs: number;
  maxFormantHz: number;
  timeStep: number;
};

export type ReferenceRegion = {
  f1: number;
  f2: number;
  radiusF1: number;
  radiusF2: number;
};

export type CorpusToken = {
  id: string;
  word: string;
  display: string;
  vowel: string;
  ipa: string;
  color: string;
  analysis: AnalysisHints;
  reference: ReferenceRegion;
};

export type Corpus = {
  version: string;
  language: string;
  description: string;
  tokens: CorpusToken[];
};

export type AnalyzeResponse = {
  wordId: string;
  word: string;
  vowel: string;
  f1: number | null;
  f2: number | null;
  f3: number | null;
  duration: number;
  confidence: number;
  warnings: string[];
  extractionWindow: {
    start: number;
    end: number;
    midpoint: number;
  } | null;
};

export type ResultRow = AnalyzeResponse & {
  timestamp: string;
  color: string;
  ipa: string;
};
