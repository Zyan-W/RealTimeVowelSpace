# Project Log

## 2026-06-03

- Repository started empty and was not a Git repository.
- Product direction: public web teaching demo, English word-list task, record one token then analyze immediately.
- Original technical direction: React/Vite frontend records WAV in-browser; FastAPI backend used Praat/Parselmouth and discarded uploaded audio after analysis. This was superseded on 2026-06-04 by a project-owned NumPy/LPC analyzer to fit the Apache-2.0 release policy.
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
- These datasets differ in accent coverage, speaker grouping, word lists, measurement method, and available distribution metadata, so the first correction removed unsupported hand-tuned target ellipses.
- Removed the hand-tuned `radiusF1` and `radiusF2` fields from corpus JSON as an interim step and changed the chart to show reference center points only.
- This interim point-only design was superseded by the normalized source-derived ellipse work below.

## 2026-06-03 Normalized Reference Ellipses

- Restored reference ranges as source-derived ellipses rather than hand-tuned radii.
- Added `scripts/generate_reference_ellipses.py` to generate corpus reference centers and 68% F1/F2 covariance ellipses from public data.
- Method: for each source corpus, calculate Lobanov speaker-intrinsic z-scores for F1/F2, project normalized values back to a corpus-average Hz scale, then calculate each vowel's covariance ellipse.
- Source coverage: Hillenbrand et al. 1995 `h95` adult men/women for American English, Deterding 1997 MARSEC speaker spreadsheets for British English, and Mokhtari/Tanaka 2000 ETL formant data for Japanese.
- Frontend renders normalized reference ellipses as sampled SVG paths so Bark display converts each sampled point instead of assuming linear Hz scaling.

## 2026-06-04 Version and Cross-Platform Launch

- Promoted the visible corpus version label to `ver 1.0` and added the author line `WANG Zhiyan` under the version row in the prompt panel.
- Added a macOS entry script, `start-dev.sh`.
- Moved shared launcher preparation into `scripts/bootstrap_dev.py` so Windows and macOS startup do not duplicate venv, pip, npm, and dependency-install logic.
- Kept `start-dev.cmd` as a thin Windows entrypoint and `scripts/dev_launcher.py` as the shared backend/frontend process manager.
- Removed old Windows-only `run-backend.cmd` and `run-frontend.cmd` helpers because the unified launcher supersedes them.

## 2026-06-04 README Localization

- Rewrote `README.md` as a bilingual Japanese-then-English user guide.
- README now focuses on project functionality, a concise implementation overview, GitHub download options, prerequisites, and Windows/macOS usage via `start-dev.cmd` and `start-dev.sh`.

## 2026-06-04 Runtime Prerequisite Installer

- Added Windows and macOS prerequisite checks before the shared Python bootstrap runs.
- Windows can offer an explicit `winget` install for missing Python 3.12 and Node.js LTS; macOS can offer an explicit Homebrew install when Homebrew is already available.
- Clarified the README distinction between system runtimes and project dependency packages.

## 2026-06-04 Source and License Review

- Reviewed tracked application code for copied-project risk: backend, frontend, launch scripts, tests, and reference-data generator are short project-specific implementations using public APIs and generic algorithms rather than copied source from a specific open-source project.
- Confirmed generated corpus JSON stores source identifiers and method metadata for the normalized reference ellipses; raw downloaded reference data remains in ignored `.tmp_data/` cache and is not tracked.
- Added bilingual README sections documenting code origin, public data sources, direct Python and Node.js dependency licenses, and the current frontend transitive license set.
- Initial review found `praat-parselmouth` was GPLv3, which conflicted with the intended Apache-2.0 release policy.
- Verification after the README/log update: backend pytest passed, frontend Vitest passed when run directly through `node.exe`, TypeScript build passed, and Vite production build passed when run directly through `node.exe`.

## 2026-06-04 Apache-2.0 Release Audit

- New release rule: publish the project under Apache License 2.0, avoid GPL/AGPL/SSPL/BUSL/unclear-license dependencies unless explicitly approved, and maintain `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, and `AI_USAGE.md`.
- Affected current code: `backend/app/analyzer.py` no longer calls Praat/Parselmouth. It now uses a short project-owned WAV reader plus NumPy-based LPC formant estimation. This removes the GPLv3 runtime dependency but can change measured F1/F2/F3 values compared with the previous Praat-backed path.
- Removed `praat-parselmouth` from `backend/requirements.txt`.
- Added Apache-2.0 `LICENSE`, a minimal `NOTICE`, third-party dependency/data-source notices, and an AI usage policy.
- Remaining release-review note: the Japanese reference source is public research data but does not declare an SPDX license on its source page; generated reference values remain in the corpus JSON and need explicit owner approval or replacement if applying a strict data-license policy.
- Verification after removing the GPL dependency: local `praat-parselmouth` was uninstalled from `backend/.venv`, backend pytest passed, source/manifests had no `parselmouth`/disallowed-license matches outside explanatory docs, frontend Vitest passed, TypeScript build passed, and Vite production build passed.
- Added a top-level README license section so GitHub readers can immediately see the Apache-2.0 license file and related notice documents.
