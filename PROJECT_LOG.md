# Project Log

## 2026-06-03

- Repository started empty and was not a Git repository.
- Product direction: public web teaching demo, English word-list task, record one token then analyze immediately.
- Technical direction: React/Vite frontend records WAV in-browser; FastAPI backend uses Praat/Parselmouth and discards uploaded audio after analysis.
- Privacy default: no server-side retention of audio or session results.
- V1 analysis approach: trim silence, choose a stable central voiced/energy window, calculate median formants, return warnings for low-quality input.
