# RealTimeVowelSpace

A public teaching demo for recording fixed English vowel tokens, extracting F1/F2 with a Praat-backed Python API, and plotting the results immediately in vowel space.

## What v1 Does

- Shows one English word prompt at a time.
- Supports English and Japanese vowel-space tasks.
- Switches English reference regions between American and British accent anchors.
- Switches formant displays between Hz and Bark.
- Records a short WAV clip in the browser.
- Sends the clip to a FastAPI backend at `POST /api/analyze-token`.
- Uses Praat/Parselmouth to estimate formants from the stable central vowel region.
- Plots each result on an inverted F1/F2 vowel chart.
- Connects recorded vowel points into a speaker vowel-space polygon when at least three vowels have been measured.
- Keeps results in the browser session only and offers CSV export.
- Does not store uploaded audio on the server.

## Project Layout

```text
backend/   FastAPI API, corpus loading, Praat formant analysis, tests
frontend/  React/Vite single page teaching interface
shared/    Versioned corpus metadata used by both sides
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. It exposes:

- `GET /api/health`
- `GET /api/corpus`
- `GET /api/corpora`
- `GET /api/corpus/{corpus_id}`
- `POST /api/analyze-token`

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000`.

## Notes on Accuracy

This first version is for teaching demonstrations, not publication-grade phonetic measurement. The backend uses conservative heuristics: it trims low-energy regions, samples a stable central window, returns median F1/F2/F3 values, and reports warnings when the signal is clipped, quiet, or too short.

Reference regions on the chart are pedagogical anchors. They are not universal pronunciation targets.

## V2 Controls

- Language: English or Japanese.
- Reference: American/British for English; native-speaker reference for Japanese.
- Unit: Hz or Bark. Both recorded formants and reference regions are converted for display and CSV export.
- Polygon: recorded points are connected in corpus order so the speaker's vowel-space shape can be inspected.
