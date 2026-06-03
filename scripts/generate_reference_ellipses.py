from __future__ import annotations

import json
import math
import tarfile
from pathlib import Path
from typing import Any

import httpx
import numpy as np

try:
    import pandas as pd
    import rdata
except ImportError as error:
    raise SystemExit(
        "This source-data generator needs optional development packages. "
        "Install them with: backend\\.venv\\Scripts\\python.exe -m pip install pandas rdata xlrd"
    ) from error


ROOT = Path(__file__).resolve().parents[1]
CORPUS_DIR = ROOT / "shared" / "corpus"
CACHE_DIR = ROOT / ".tmp_data" / "reference_sources"
CONFIDENCE = 0.68
CHI2_DF2_68 = 2.27886856637673
ELLIPSE_SCALE = math.sqrt(CHI2_DF2_68)

PHONTOOLS_URL = "https://cran.r-project.org/src/contrib/phonTools_0.2-2.2.tar.gz"
DETERDING_BASE_URL = "https://fass.ubd.edu.bn/data/JIPA-vowels/"
JAPANESE_DATA_URL = "https://isd.pu-toyama.ac.jp/~parham/documents/formantsETL/MokhtariTanaka2000_ETLformantdata.txt"


AMERICAN_MAP = {
    "heed": "i",
    "hid": "I",
    "head": "E",
    "had": "{",
    "hod": "A",
    "hawed": "O",
    "hood": "U",
    "whod": "u",
    "hud": "V",
    "heard": "3'",
}

BRITISH_MAP = {
    "heed": "ii",
    "hid": "I",
    "head": "e",
    "had": "ae",
    "hard": "aa",
    "hod": "O",
    "hawed": "oo",
    "hood": "U",
    "whod": "uu",
    "hud": "V",
    "heard": "33",
}

JAPANESE_MAP = {
    "a": "a",
    "i": "i",
    "u": "u",
    "e": "e",
    "o": "o",
}


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    corpora = {
        "american-english": load_json(CORPUS_DIR / "american-english-vowels.json"),
        "british-english": load_json(CORPUS_DIR / "british-english-vowels.json"),
        "japanese": load_json(CORPUS_DIR / "japanese-vowels.json"),
    }

    write_reference_ranges(
        corpora["american-english"],
        reference_id="american",
        source_id="hillenbrand1995-h95-adult",
        token_to_source_vowel=AMERICAN_MAP,
        normalized_data=lobanov_to_common_hz(load_hillenbrand_adults()),
    )
    write_reference_ranges(
        corpora["british-english"],
        reference_id="british",
        source_id="deterding1997-marsec",
        token_to_source_vowel=BRITISH_MAP,
        normalized_data=lobanov_to_common_hz(load_deterding()),
    )
    write_reference_ranges(
        corpora["japanese"],
        reference_id="native",
        source_id="mokhtari-tanaka2000-etl",
        token_to_source_vowel=JAPANESE_MAP,
        normalized_data=lobanov_to_common_hz(load_japanese()),
    )

    for corpus_id, data in corpora.items():
        path = CORPUS_DIR / f"{corpus_id}-vowels.json"
        path.write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def download(url: str, path: Path) -> Path:
    if path.exists():
        return path
    with httpx.Client(follow_redirects=True, timeout=60) as client:
        response = client.get(url)
        response.raise_for_status()
    path.write_bytes(response.content)
    return path


def load_hillenbrand_adults() -> "pd.DataFrame":
    archive_path = download(PHONTOOLS_URL, CACHE_DIR / "phonTools.tar.gz")
    extract_dir = CACHE_DIR / "phonTools"
    h95_path = extract_dir / "phonTools" / "data" / "h95.rda"
    if not h95_path.exists():
        with tarfile.open(archive_path, "r:gz") as archive:
            archive.extract("phonTools/data/h95.rda", extract_dir, filter="data")

    data = rdata.read_rda(h95_path)["h95"]
    data = data[data["type"].isin(["m", "w"])].copy()
    data = data.rename(columns={"type": "sex"})
    data["speaker"] = data["speaker"].astype(int).astype(str)
    return data[["speaker", "sex", "vowel", "f1", "f2"]]


def load_deterding() -> "pd.DataFrame":
    rows: list[dict[str, Any]] = []
    sex_map = {**{speaker: "f" for speaker in "ADEFG"}, **{speaker: "m" for speaker in "BCHJK"}}
    for speaker, sex in sex_map.items():
        path = download(f"{DETERDING_BASE_URL}{speaker}.xls", CACHE_DIR / f"deterding-{speaker}.xls")
        workbook = pd.ExcelFile(path)
        for sheet_name in workbook.sheet_names:
            sheet = pd.read_excel(path, sheet_name=sheet_name)
            sheet.columns = [str(column).strip() for column in sheet.columns]
            for row in sheet.itertuples(index=False):
                item = row._asdict()
                try:
                    f1 = float(item["F1"])
                    f2 = float(item["F2"])
                except (KeyError, TypeError, ValueError):
                    continue
                if math.isfinite(f1) and math.isfinite(f2):
                    rows.append({"speaker": speaker, "sex": sex, "vowel": sheet_name, "f1": f1, "f2": f2})
    return pd.DataFrame(rows)


def load_japanese() -> "pd.DataFrame":
    path = download(JAPANESE_DATA_URL, CACHE_DIR / "MokhtariTanaka2000_ETLformantdata.txt")
    raw = pd.read_csv(
        path,
        sep=r"\s+",
        header=None,
        names=["f1", "f2", "f3", "f4", "b1", "b2", "b3", "b4"],
    )
    rows: list[dict[str, Any]] = []
    vowels = ["i", "e", "a", "o", "u"]
    index = 0
    for speaker_number in range(1, 6):
        for vowel in vowels:
            for _word in range(22):
                for _frame in range(5):
                    row = raw.iloc[index]
                    rows.append(
                        {
                            "speaker": f"S{speaker_number}",
                            "sex": "m",
                            "vowel": vowel,
                            "f1": float(row.f1),
                            "f2": float(row.f2),
                        }
                    )
                    index += 1
    return pd.DataFrame(rows)


def lobanov_to_common_hz(data: "pd.DataFrame") -> "pd.DataFrame":
    data = data.copy()
    speaker_stats = data.groupby("speaker")[["f1", "f2"]].agg(["mean", "std"])
    normalized_rows: list[dict[str, Any]] = []
    for row in data.to_dict(orient="records"):
        stats = speaker_stats.loc[row["speaker"]]
        f1_sd = stats[("f1", "std")]
        f2_sd = stats[("f2", "std")]
        if f1_sd <= 0 or f2_sd <= 0:
            continue
        row["z1"] = (row["f1"] - stats[("f1", "mean")]) / f1_sd
        row["z2"] = (row["f2"] - stats[("f2", "mean")]) / f2_sd
        normalized_rows.append(row)

    normalized = pd.DataFrame(normalized_rows)
    target_mean = speaker_stats.xs("mean", axis=1, level=1).mean()
    target_sd = speaker_stats.xs("std", axis=1, level=1).mean()
    normalized["normalizedF1"] = target_mean["f1"] + normalized["z1"] * target_sd["f1"]
    normalized["normalizedF2"] = target_mean["f2"] + normalized["z2"] * target_sd["f2"]
    return normalized


def write_reference_ranges(
    corpus: dict[str, Any],
    reference_id: str,
    source_id: str,
    token_to_source_vowel: dict[str, str],
    normalized_data: "pd.DataFrame",
) -> None:
    for token in corpus["tokens"]:
        source_vowel = token_to_source_vowel[token["id"]]
        source_rows = normalized_data[normalized_data["vowel"] == source_vowel]
        ellipse = ellipse_from_rows(source_rows, source_id)
        token["references"][reference_id]["f1"] = ellipse.pop("f1")
        token["references"][reference_id]["f2"] = ellipse.pop("f2")
        token["references"][reference_id]["ellipse"] = ellipse


def ellipse_from_rows(rows: "pd.DataFrame", source_id: str) -> dict[str, Any]:
    points = rows[["normalizedF2", "normalizedF1"]].to_numpy(float)
    center = points.mean(axis=0)
    covariance = np.cov(points, rowvar=False)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    order = eigenvalues.argsort()[::-1]
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]

    semi_major = math.sqrt(max(eigenvalues[0], 0)) * ELLIPSE_SCALE
    semi_minor = math.sqrt(max(eigenvalues[1], 0)) * ELLIPSE_SCALE
    angle = math.degrees(math.atan2(eigenvectors[1, 0], eigenvectors[0, 0]))
    while angle <= -90:
        angle += 180
    while angle > 90:
        angle -= 180

    return {
        "f1": round(center[1]),
        "f2": round(center[0]),
        "semiMajorHz": round(semi_major),
        "semiMinorHz": round(semi_minor),
        "angleDeg": round(angle, 1),
        "confidence": CONFIDENCE,
        "n": int(len(rows)),
        "normalized": True,
        "method": "speaker-lobanov-z-projected-to-corpus-average-hz",
        "source": source_id,
    }


if __name__ == "__main__":
    main()
