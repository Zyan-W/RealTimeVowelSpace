from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import AnalysisError, analyze_audio_bytes
from .corpus import DEFAULT_CORPUS_ID, get_token, load_corpora, load_corpus
from .models import AnalyzeResponse, Corpus


app = FastAPI(
    title="RealTimeVowelSpace API",
    version="1.0.0",
    description="Project-owned vowel formant estimation for a teaching demo.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/corpus", response_model=Corpus)
def corpus() -> Corpus:
    return load_corpus()


@app.get("/api/corpora", response_model=list[Corpus])
def corpora() -> list[Corpus]:
    return list(load_corpora().values())


@app.get("/api/corpus/{corpus_id}", response_model=Corpus)
def corpus_by_id(corpus_id: str) -> Corpus:
    try:
        return load_corpus(corpus_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown corpus id: {corpus_id}") from exc


@app.post("/api/analyze-token", response_model=AnalyzeResponse)
async def analyze_token(
    corpus_id: str = Form(DEFAULT_CORPUS_ID),
    word_id: str = Form(...),
    vowel: str = Form(...),
    audio: UploadFile = File(...),
) -> AnalyzeResponse:
    try:
        token = get_token(corpus_id, word_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown token: {corpus_id}/{word_id}") from exc

    if token.vowel != vowel:
        raise HTTPException(status_code=400, detail="Submitted vowel does not match the configured token.")

    data = await audio.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio clip is too large.")

    try:
        return analyze_audio_bytes(data, audio.filename or "recording.wav", audio.content_type or "audio/wav", token)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
