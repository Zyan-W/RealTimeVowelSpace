# Project Log

## 2026-06-03

- Repository started empty and was not a Git repository.
- Product direction: public web teaching demo, English word-list task, record one token then analyze immediately.
- Technical direction: React/Vite frontend records WAV in-browser; FastAPI backend uses Praat/Parselmouth and discards uploaded audio after analysis.
- Privacy default: no server-side retention of audio or session results.
- V1 analysis approach: trim silence, choose a stable central voiced/energy window, calculate median formants, return warnings for low-quality input.

## 2026-06-03 V2

- Added English reference-set switching for American and British accent anchors.
- Added Hz/Bark display conversion for chart axes, reference points, recorded values, and CSV export.
- Removed the English diphthong token `hayed`.
- Added a recorded-speaker vowel-space polygon that connects measured points in corpus order.
- Added a Japanese five-vowel corpus and a language switch between English and Japanese.

## 2026-06-03 Usability

- Added a Windows `start-dev.cmd` launcher that prepares dependencies, opens backend/frontend service windows, and opens the browser.
- Reworked README into a quick-start guide before the lower-level backend/frontend commands.
- Made frontend backend-connection errors more direct for users who open the page before the API is running.

## 2026-06-03 Encoding Fix

- Re-serialized corpus JSON files with ASCII Unicode escapes so Windows console encoding cannot corrupt display or loading.
- Set backend launcher environment to UTF-8 and added a regression test that corpus JSON files remain ASCII-safe.
- Replaced nested backend/frontend command chains with helper `.cmd` launchers so Windows quoting cannot corrupt environment variables or executable paths.
- Added Node/npm fallback lookup in Program Files so frontend launch does not depend only on PATH refresh.
- Frontend helper now launches Vite through `node.exe node_modules\vite\bin\vite.js` to avoid Windows wrapper-script access errors.
- Prefer Program Files Node/npm over PATH entries so stale or restricted PATH shims cannot break the launcher.
- Added `stop-dev.cmd` as a manual cleanup helper for old local services.
- Replaced fragile multi-window startup with a Python launcher that starts, checks, opens, and stops backend/frontend as one managed process group.
- Launcher now chooses free backend/frontend ports automatically, passes the selected backend port into Vite's proxy, and verifies `/api/corpora` through the frontend before opening the browser.
- Added root `pytest.ini` so backend tests can be run from the repository root.

## 2026-06-03 Accent Systems

- Replaced the single English corpus plus American/British reference toggle with separate `american-english` and `british-english` corpora.
- American English keeps a General American teaching set including LOT-PALM and r-colored NURSE anchors.
- British English uses a Standard Southern British / RP-style stressed monophthong set that keeps LOT, BATH-PALM-START, THOUGHT, and NURSE as distinct anchors.
- Speaker polygon now waits until every token in the selected corpus has a measured point, then connects the points by geometric angle around their center instead of corpus order.

## 2026-06-03 Reference Data Review

- Public formant datasets exist for parts of the current demo scope: Hillenbrand et al. 1995 for American English `hVd` vowels, Deterding 1997 for Standard Southern British monophthongs, and Mokhtari and Tanaka 2000 for Japanese vowels.
- These datasets differ in accent coverage, speaker grouping, word lists, measurement method, and available distribution metadata, so the v1 chart should not show one comparable set of target ellipses across all corpora.
- Removed the hand-tuned `radiusF1` and `radiusF2` fields from corpus JSON and changed the chart to show reference center points only.
- README now documents the source lineage and the reason reference ellipses are intentionally omitted.
