# Third-Party Notices

This project is intended for release under the Apache License 2.0. The application code in this repository is project-owned implementation code and is not copied from specific open-source repositories, blogs, Stack Overflow posts, or papers.

## Direct Python Dependencies

| Name | Purpose | Version | License |
| --- | --- | --- | --- |
| FastAPI | Backend API framework | 0.125.0 | MIT |
| Uvicorn | ASGI development server, installed with `standard` extras | 0.38.0 | BSD-3-Clause |
| python-multipart | Multipart form parsing for audio uploads | 0.0.20 | Apache-2.0 |
| NumPy | Numerical arrays, signal windows, LPC and statistics | 2.3.5 | BSD-3-Clause; binary wheels may include bundled numerical/runtime libraries such as OpenBLAS and GCC runtime components with their own notices and exceptions |
| pytest | Backend test runner | 9.0.2 | MIT |
| HTTPX | Backend tests and optional reference-data download script | 0.28.1 | BSD-3-Clause |

## Optional Reference-Data Regeneration Packages

These packages are not installed by the default launcher. They are only needed if a developer reruns `scripts/generate_reference_ellipses.py`.

| Name | Purpose | Last locally checked version | License |
| --- | --- | --- | --- |
| pandas | Spreadsheet and table reading for public formant datasets | 3.0.3 | BSD-3-Clause |
| rdata | Reading the CRAN `phonTools` `h95.rda` dataset | 1.0.0 | MIT |
| xlrd | Reading Deterding `.xls` source spreadsheets through pandas | 2.0.2 | BSD-style |

## Direct Node.js Dependencies

Versions below are from `frontend/package-lock.json`.

| Name | Purpose | Version | License |
| --- | --- | --- | --- |
| @vitejs/plugin-react | React support for Vite | 5.2.0 | MIT |
| lucide-react | Frontend icon components | 0.562.0 | ISC |
| react | Frontend UI runtime | 19.2.7 | MIT |
| react-dom | Browser rendering for React | 19.2.7 | MIT |
| typescript | Frontend type checking | 5.9.3 | Apache-2.0 |
| vite | Frontend dev server and production build | 7.3.5 | MIT |
| @testing-library/react | Frontend component tests | 16.3.2 | MIT |
| @testing-library/user-event | Frontend interaction tests | 14.6.1 | MIT |
| @types/react | React TypeScript declarations | 19.2.16 | MIT |
| @types/react-dom | React DOM TypeScript declarations | 19.2.3 | MIT |
| jsdom | DOM environment for frontend tests | 27.4.0 | MIT |
| vitest | Frontend test runner | 4.1.8 | MIT |

The current license set among transitive packages in `frontend/package-lock.json` is Apache-2.0, BSD-2-Clause, BSD-3-Clause, BlueOak-1.0.0, CC-BY-4.0, CC0-1.0, ISC, MIT, and MIT-0.

## Reference Data Sources

Raw source data and download caches are not tracked in this repository. The committed corpus JSON files contain generated pedagogical reference centers and ellipses derived from these public sources.

| Purpose | Source | License or use statement | Release note |
| --- | --- | --- | --- |
| American English reference | Hillenbrand et al. 1995 data via CRAN `phonTools` `h95` | `phonTools` 0.2-2.2 is BSD_2_clause + file LICENSE | Permissive package license |
| British English reference | David Deterding 1997 JIPA vowel measurements | Source page permits use of the measurements; no SPDX software license is declared | Public reuse statement exists |
| Japanese reference | Mokhtari and Tanaka 2000 ETL Japanese vowel formant data | Publicly available research data; no SPDX software license is declared on the source page | Needs explicit release approval or replacement if a stricter data-license policy is required |

## Disallowed License Audit

The tracked dependency manifests no longer include GPL, AGPL, SSPL, or BUSL dependencies. The previous GPLv3 runtime dependency `praat-parselmouth` was removed from `backend/requirements.txt` and from the backend analyzer implementation.
