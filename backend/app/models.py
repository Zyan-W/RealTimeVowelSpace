from __future__ import annotations

from pydantic import BaseModel, Field


class AnalysisHints(BaseModel):
    windowMs: int = Field(default=120, ge=40, le=300)
    maxFormantHz: int = Field(default=5500, ge=3500, le=7000)
    timeStep: float = Field(default=0.005, gt=0, le=0.05)


class ReferenceRegion(BaseModel):
    f1: float
    f2: float
    radiusF1: float
    radiusF2: float


class ReferenceSet(BaseModel):
    id: str
    label: str


class CorpusToken(BaseModel):
    id: str
    word: str
    display: str
    vowel: str
    ipa: str
    color: str
    analysis: AnalysisHints
    references: dict[str, ReferenceRegion]


class Corpus(BaseModel):
    id: str
    version: str
    language: str
    languageCode: str
    description: str
    referenceSets: list[ReferenceSet]
    tokens: list[CorpusToken]


class ExtractionWindow(BaseModel):
    start: float
    end: float
    midpoint: float


class AnalyzeResponse(BaseModel):
    wordId: str
    word: str
    vowel: str
    f1: float | None
    f2: float | None
    f3: float | None = None
    duration: float
    confidence: float = Field(ge=0, le=1)
    warnings: list[str]
    extractionWindow: ExtractionWindow | None
