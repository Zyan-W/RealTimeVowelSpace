from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .models import Corpus, CorpusToken


ROOT_DIR = Path(__file__).resolve().parents[2]
CORPUS_PATH = ROOT_DIR / "shared" / "corpus" / "english-vowels.json"


@lru_cache(maxsize=1)
def load_corpus() -> Corpus:
    with CORPUS_PATH.open("r", encoding="utf-8") as handle:
        return Corpus.model_validate(json.load(handle))


def get_token(token_id: str) -> CorpusToken:
    corpus = load_corpus()
    for token in corpus.tokens:
        if token.id == token_id:
            return token
    raise KeyError(token_id)
