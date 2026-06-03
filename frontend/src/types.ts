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

export type ReferenceSet = {
  id: string;
  label: string;
};

export type CorpusToken = {
  id: string;
  word: string;
  display: string;
  vowel: string;
  ipa: string;
  color: string;
  analysis: AnalysisHints;
  references: Record<string, ReferenceRegion>;
};

export type Corpus = {
  id: string;
  version: string;
  language: string;
  languageCode: string;
  description: string;
  referenceSets: ReferenceSet[];
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
  corpusId: string;
  timestamp: string;
  color: string;
  ipa: string;
};

export type DisplayUnit = "hz" | "bark";
