from __future__ import annotations

import math
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from .models import AnalyzeResponse, CorpusToken, ExtractionWindow


class AnalysisError(RuntimeError):
    """Raised when a recording cannot produce a useful teaching result."""


@dataclass(frozen=True)
class StableWindow:
    start: float
    end: float
    midpoint: float
    confidence: float
    warnings: list[str]


def analyze_audio_bytes(audio: bytes, filename: str, content_type: str, token: CorpusToken) -> AnalyzeResponse:
    suffix = _safe_suffix(filename, content_type)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
            handle.write(audio)
            temp_path = Path(handle.name)
        return analyze_audio_file(temp_path, token)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)


def analyze_audio_file(path: Path, token: CorpusToken) -> AnalyzeResponse:
    try:
        import parselmouth
    except ImportError as exc:
        raise AnalysisError("Praat/Parselmouth is not installed on the backend.") from exc

    try:
        sound = parselmouth.Sound(str(path))
    except Exception as exc:
        raise AnalysisError("Could not read this audio file. Please send a WAV recording.") from exc

    duration = float(sound.get_total_duration())
    if duration < 0.12:
        raise AnalysisError("Recording is too short for vowel measurement.")

    samples = np.asarray(sound.values, dtype=float)
    if samples.ndim == 2:
        mono = samples.mean(axis=0)
    else:
        mono = samples

    sample_rate = float(sound.sampling_frequency)
    stable = _find_stable_window(mono, sample_rate, duration, token.analysis.windowMs / 1000)
    formant = sound.to_formant_burg(
        time_step=token.analysis.timeStep,
        max_number_of_formants=5,
        maximum_formant=token.analysis.maxFormantHz,
        window_length=0.025,
        pre_emphasis_from=50,
    )

    times = np.linspace(stable.start, stable.end, num=9)
    f1_values = _collect_formant_values(formant, 1, times)
    f2_values = _collect_formant_values(formant, 2, times)
    f3_values = _collect_formant_values(formant, 3, times)

    warnings = list(stable.warnings)
    clipped_ratio = float(np.mean(np.abs(mono) >= 0.98)) if mono.size else 0
    if clipped_ratio > 0.001:
        warnings.append("clipping_detected")

    f1 = _median_or_none(f1_values)
    f2 = _median_or_none(f2_values)
    f3 = _median_or_none(f3_values)

    if f1 is None or f2 is None:
        raise AnalysisError("Praat could not estimate stable F1/F2 values for this token.")

    confidence = stable.confidence
    if warnings:
        confidence = max(0.35, confidence - 0.12 * len(warnings))

    return AnalyzeResponse(
        wordId=token.id,
        word=token.word,
        vowel=token.vowel,
        f1=round(f1, 1),
        f2=round(f2, 1),
        f3=round(f3, 1) if f3 else None,
        duration=round(duration, 3),
        confidence=round(min(1, max(0, confidence)), 2),
        warnings=warnings,
        extractionWindow=ExtractionWindow(
            start=round(stable.start, 3),
            end=round(stable.end, 3),
            midpoint=round(stable.midpoint, 3),
        ),
    )


def _find_stable_window(samples: np.ndarray, sample_rate: float, duration: float, window_seconds: float) -> StableWindow:
    warnings: list[str] = []
    if samples.size == 0:
        raise AnalysisError("Recording contains no audio samples.")

    mono = samples.astype(float)
    peak = float(np.max(np.abs(mono)))
    if peak < 0.01:
        raise AnalysisError("Recording is too quiet. Move closer to the microphone and try again.")
    if peak < 0.04:
        warnings.append("low_level")

    frame_length = max(1, int(sample_rate * 0.02))
    hop = max(1, int(sample_rate * 0.005))
    energies = []
    centers = []
    for start in range(0, max(1, len(mono) - frame_length), hop):
        frame = mono[start : start + frame_length]
        rms = float(np.sqrt(np.mean(frame * frame)))
        energies.append(rms)
        centers.append((start + frame_length / 2) / sample_rate)

    energy_array = np.asarray(energies)
    center_array = np.asarray(centers)
    if energy_array.size == 0:
        raise AnalysisError("Recording is too short to locate a vowel region.")

    threshold = max(float(np.percentile(energy_array, 70)) * 0.45, 0.015)
    voiced_centers = center_array[energy_array >= threshold]
    if voiced_centers.size < 3:
        raise AnalysisError("No stable voiced region was found.")

    voiced_start = float(voiced_centers[0])
    voiced_end = float(voiced_centers[-1])
    voiced_duration = max(0, voiced_end - voiced_start)
    if voiced_duration < 0.08:
        warnings.append("short_voiced_region")

    midpoint = voiced_start + voiced_duration / 2
    half_window = min(window_seconds / 2, max(0.04, voiced_duration / 2))
    start = max(0.0, midpoint - half_window)
    end = min(duration, midpoint + half_window)
    if end - start < 0.06:
        start = max(0.0, midpoint - 0.03)
        end = min(duration, midpoint + 0.03)

    local_mask = (center_array >= start) & (center_array <= end)
    local_energy = energy_array[local_mask]
    energy_cv = _coefficient_of_variation(local_energy)
    confidence = 0.92 - min(0.35, energy_cv)
    if energy_cv > 0.45:
        warnings.append("unstable_energy")

    return StableWindow(start=start, end=end, midpoint=midpoint, confidence=confidence, warnings=warnings)


def _collect_formant_values(formant, formant_number: int, times: np.ndarray) -> list[float]:
    values: list[float] = []
    for time in times:
        value = formant.get_value_at_time(formant_number, float(time))
        if value is not None and math.isfinite(value) and value > 0:
            values.append(float(value))
    return values


def _median_or_none(values: list[float]) -> float | None:
    if not values:
        return None
    return float(np.median(np.asarray(values)))


def _coefficient_of_variation(values: np.ndarray) -> float:
    if values.size == 0:
        return 0
    mean = float(np.mean(values))
    if mean <= 0:
        return 0
    return float(np.std(values) / mean)


def _safe_suffix(filename: str, content_type: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in {".wav", ".wave", ".aiff", ".aif", ".flac"}:
        return suffix
    if content_type in {"audio/wav", "audio/wave", "audio/x-wav"}:
        return ".wav"
    return ".wav"
