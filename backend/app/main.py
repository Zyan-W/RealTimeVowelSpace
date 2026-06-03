from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import AnalysisError, analyze_audio_bytes
from .corpus import get_token, load_corpus
from .models import AnalyzeResponse, Corpus


app = FastAPI(
    title="RealTimeVowelSpace API",
    version="0.1.0",
    description="Praat-backed vowel formant extraction for a teaching demo.",
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


@app.post("/api/analyze-token", response_model=AnalyzeResponse)
async def analyze_token(
    word_id: str = Form(...),
    vowel: str = Form(...),
    audio: UploadFile = File(...),
) -> AnalyzeResponse:
    try:
        token = get_token(word_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown word id: {word_id}") from exc

    if token.vowel != vowel:
        raise HTTPException(status_code=400, detail="Submitted vowel does not match the configured token.")

    data = await audio.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio clip is too large.")

    try:
        return analyze_audio_bytes(data, audio.filename or "recording.wav", audio.content_type or "audio/wav", token)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
