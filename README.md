# RealTimeVowelSpace

A public teaching demo for recording fixed vowel tokens, extracting F1/F2 with a Praat-backed Python API, and plotting the results immediately in vowel space.

## Quick Start on Windows

The easiest way to run the tool is:

1. Double-click `start-dev.cmd` in the project folder.
2. Wait until the launcher prints `RealTimeVowelSpace is ready`.
3. Use the browser page that the launcher opens.

The launcher checks the backend environment, installs missing packages when needed, starts the backend and frontend, and opens the browser. If the usual ports are busy, it automatically chooses nearby free ports and prints the actual browser URL.

To stop the tool, press `Ctrl+C` in the launcher window or close that window.

If the launcher says `npm.cmd was not found`, install Node.js LTS and open the launcher again.

If the launcher says Python was not found, install Python 3.12 or newer and open the launcher again.

## What the Tool Does

- Shows one word or kana prompt at a time.
- Supports American English, British English, and Japanese vowel-space tasks.
- Treats American English and British English as separate vowel systems with separate word lists and reference regions.
- Switches formant displays between Hz and Bark.
- Records a short WAV clip in the browser.
- Sends the clip to a FastAPI backend at `POST /api/analyze-token`.
- Uses Praat/Parselmouth to estimate formants from the stable central vowel region.
- Plots each result on an inverted F1/F2 vowel chart.
- Connects recorded vowel points into a speaker vowel-space polygon after the full current word list has been measured.
- Keeps results in the browser session only and offers CSV export.
- Does not store uploaded audio on the server.

## Using the Page

1. Choose `American`, `British`, or `Japanese`.
2. Choose `Hz` or `Bark`.
3. Click `Record`, say the displayed token, then click `Stop`.
4. Continue through the list. Once every token in the chosen system has been measured, the speaker vowel-space polygon appears.
5. Use the download button to export the session CSV.

Switching systems clears the current session so American English, British English, and Japanese measurements do not mix.

## Project Layout

```text
backend/   FastAPI API, corpus loading, Praat formant analysis, tests
frontend/  React/Vite single page teaching interface
shared/    Versioned corpus metadata used by both sides
```

## Backend

Use this manual route only if you do not want to use `start-dev.cmd`.

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

Use this manual route only if you do not want to use `start-dev.cmd`.

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend defaults to `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000`.

## Notes on Accuracy

This first version is for teaching demonstrations, not publication-grade phonetic measurement. The backend uses conservative heuristics: it trims low-energy regions, samples a stable central window, returns median F1/F2/F3 values, and reports warnings when the signal is clipped, quiet, or too short.

Reference regions on the chart are pedagogical anchors. They are not universal pronunciation targets.

## Corpus Notes

The English systems are separated by lexical-set behavior rather than by reusing one word list with two reference overlays. Wells-style lexical sets distinguish, for example, RP LOT from General American LOT-PALM, and RP BATH-PALM-START from General American TRAP-BATH. British reference anchors use Standard Southern British / RP-style stressed monophthongs, while American anchors remain broad teaching targets because low vowels and back vowels vary strongly by region.

Useful background sources:

- Wells lexical sets summary: https://teflpedia.com/Vowel_set
- RP vowel chart explanation: https://www.uv.es/anglotic/accents_of_english/01/jc_wells_vowel_chart.html
- Deterding 1997 Standard Southern British monophthong formants: https://cir.nii.ac.jp/crid/1362825896085142912?lang=en
- Clopper, Pisoni, and de Jong 2005 on regional American vowel variation: https://pmc.ncbi.nlm.nih.gov/articles/PMC3432912/

## Current Controls

- System: American English, British English, or Japanese.
- Unit: Hz or Bark. Both recorded formants and reference regions are converted for display and CSV export.
- Polygon: after the full selected word list is recorded, measured points are sorted around their center and connected into a closed speaker vowel-space shape.
