# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import io
import math
import wave
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
    del filename, content_type
    return _analyze_wav(io.BytesIO(audio), token)


def analyze_audio_file(path: Path, token: CorpusToken) -> AnalyzeResponse:
    return _analyze_wav(path, token)


def _analyze_wav(source: Path | io.BytesIO, token: CorpusToken) -> AnalyzeResponse:
    mono, sample_rate = _read_wav(source)
    duration = len(mono) / sample_rate
    if duration < 0.12:
        raise AnalysisError("Recording is too short for vowel measurement.")

    stable = _find_stable_window(mono, sample_rate, duration, token.analysis.windowMs / 1000)
    analysis_samples, analysis_rate = _resample_for_lpc(mono, sample_rate, token.analysis.maxFormantHz)

    times = np.linspace(stable.start, stable.end, num=9)
    formant_sets = [
        _estimate_formants(analysis_samples, analysis_rate, float(time), token.analysis.maxFormantHz)
        for time in times
    ]
    f1_values = [formants[0] for formants in formant_sets if len(formants) > 0]
    f2_values = [formants[1] for formants in formant_sets if len(formants) > 1]
    f3_values = [formants[2] for formants in formant_sets if len(formants) > 2]

    warnings = list(stable.warnings)
    clipped_ratio = float(np.mean(np.abs(mono) >= 0.98)) if mono.size else 0
    if clipped_ratio > 0.001:
        warnings.append("clipping_detected")

    f1 = _median_or_none(f1_values)
    f2 = _median_or_none(f2_values)
    f3 = _median_or_none(f3_values)

    if f1 is None or f2 is None:
        raise AnalysisError("Could not estimate stable F1/F2 values for this token.")

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


def _read_wav(source: Path | io.BytesIO) -> tuple[np.ndarray, int]:
    try:
        wave_source = str(source) if isinstance(source, Path) else source
        with wave.open(wave_source, "rb") as handle:
            if handle.getcomptype() != "NONE":
                raise AnalysisError("Compressed WAV files are not supported.")
            channels = handle.getnchannels()
            sample_width = handle.getsampwidth()
            sample_rate = handle.getframerate()
            frames = handle.readframes(handle.getnframes())
    except (EOFError, OSError, wave.Error) as exc:
        raise AnalysisError("Could not read this audio file. Please send a WAV recording.") from exc

    samples = _pcm_to_float(frames, sample_width)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return samples.astype(float), sample_rate


def _pcm_to_float(data: bytes, sample_width: int) -> np.ndarray:
    if sample_width == 1:
        return (np.frombuffer(data, dtype=np.uint8).astype(float) - 128) / 128
    if sample_width == 2:
        return np.frombuffer(data, dtype="<i2").astype(float) / 32768
    if sample_width == 3:
        raw = np.frombuffer(data, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        values = raw[:, 0] | (raw[:, 1] << 8) | (raw[:, 2] << 16)
        values = np.where(values & 0x800000, values - 0x1000000, values)
        return values.astype(float) / 8388608
    if sample_width == 4:
        return np.frombuffer(data, dtype="<i4").astype(float) / 2147483648
    raise AnalysisError("Unsupported WAV sample width.")


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


def _resample_for_lpc(samples: np.ndarray, sample_rate: float, max_formant_hz: int) -> tuple[np.ndarray, float]:
    target_rate = max(12000, min(16000, int(max_formant_hz * 2.8)))
    if sample_rate <= target_rate:
        return samples, sample_rate
    duration = len(samples) / sample_rate
    old_times = np.linspace(0, duration, num=len(samples), endpoint=False)
    new_count = max(1, int(duration * target_rate))
    new_times = np.linspace(0, duration, num=new_count, endpoint=False)
    return np.interp(new_times, old_times, samples).astype(float), float(target_rate)


def _estimate_formants(samples: np.ndarray, sample_rate: float, time: float, max_formant_hz: int) -> list[float]:
    half_length = int(sample_rate * 0.015)
    center = int(time * sample_rate)
    start = max(0, center - half_length)
    end = min(len(samples), center + half_length)
    frame = samples[start:end].astype(float)
    if frame.size < sample_rate * 0.018:
        return []

    frame = frame - float(np.mean(frame))
    if float(np.sqrt(np.mean(frame * frame))) < 0.0001:
        return []
    frame[1:] = frame[1:] - 0.97 * frame[:-1]
    frame *= np.hamming(frame.size)

    order = max(8, min(22, int(sample_rate / 1000) + 2))
    coeffs = _lpc_coefficients(frame, order)
    roots = np.roots(coeffs)
    candidates: list[tuple[float, float]] = []
    for root in roots:
        if np.imag(root) <= 0 or not 0 < abs(root) < 1:
            continue
        frequency = abs(math.atan2(np.imag(root), np.real(root))) * sample_rate / (2 * math.pi)
        bandwidth = -sample_rate * math.log(abs(root)) / math.pi
        if 150 <= frequency <= max_formant_hz and bandwidth <= 900:
            candidates.append((float(frequency), float(bandwidth)))
    return [frequency for frequency, _bandwidth in sorted(candidates)[:3]]


def _lpc_coefficients(frame: np.ndarray, order: int) -> np.ndarray:
    autocorr = np.correlate(frame, frame, mode="full")[frame.size - 1 : frame.size + order]
    if autocorr[0] <= 1e-9:
        return np.array([1.0])

    coeffs = np.zeros(order + 1)
    coeffs[0] = 1.0
    error = float(autocorr[0])
    for index in range(1, order + 1):
        reflection = -float(autocorr[index] + np.dot(coeffs[1:index], autocorr[index - 1 : 0 : -1])) / error
        next_coeffs = coeffs.copy()
        for inner in range(1, index):
            next_coeffs[inner] = coeffs[inner] + reflection * coeffs[index - inner]
        next_coeffs[index] = reflection
        coeffs = next_coeffs
        error *= max(1e-9, 1 - reflection * reflection)
    return coeffs


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
