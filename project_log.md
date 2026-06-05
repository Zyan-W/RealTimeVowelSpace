# RealTimeVowelSpace Project Log

This log preserves durable project context for future Codex sessions. It is not a
reasoning transcript and should not contain raw recordings, personal data, local
cache contents, or hidden implementation notes.

## 2026-06-05 - 3D articulatory visualization

- Goal: add a first-version 3D vocal-tract visualization to the existing
  formant-based vowel-space teaching app.
- Product boundary: the 3D view is a pedagogical approximation derived from
  F1/F2/F3, not an anatomical reconstruction of the speaker.
- Platform decision: implement in the existing Web app with Three.js/WebGL and
  OrbitControls before considering any iOS wrapper or native app.
- Visual direction: use a semi-transparent midsagittal head/vocal-tract model
  with tongue, lips, palate, jaw cue, and a deformable resonance tube.
- API decision: keep the backend `/api/analyze-token` response unchanged.
  Derive local `ArticulationEstimate` values in the frontend only.
- Export decision: do not add articulation columns to CSV in v1 so derived
  heuristic values are not mistaken for measured acoustic data.
- Privacy/release note: before the first push, re-check the upload set for
  recordings, caches, personal device paths, and whether docs help others
  reproduce the project.
