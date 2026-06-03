from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

from app.analyzer import analyze_audio_file
from app.corpus import get_token


def test_analyze_synthetic_vowel_like_wav(tmp_path: Path):
    wav_path = tmp_path / "synthetic.wav"
    sample_rate = 16000
    duration = 0.65
    times = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)

    signal = (
        0.30 * np.sin(2 * math.pi * 120 * times)
        + 0.20 * np.sin(2 * math.pi * 700 * times)
        + 0.16 * np.sin(2 * math.pi * 1250 * times)
        + 0.10 * np.sin(2 * math.pi * 2500 * times)
    )
    signal *= np.linspace(0.2, 1.0, signal.size)
    signal = np.clip(signal, -0.8, 0.8)
    pcm = (signal * 32767).astype("<i2")

    with wave.open(str(wav_path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())

    result = analyze_audio_file(wav_path, get_token("english", "hud"))

    assert result.f1 is not None
    assert result.f2 is not None
    assert 150 <= result.f1 <= 1200
    assert 500 <= result.f2 <= 3500
    assert result.extractionWindow is not None
