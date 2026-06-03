from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .models import Corpus, CorpusToken


ROOT_DIR = Path(__file__).resolve().parents[2]
CORPUS_DIR = ROOT_DIR / "shared" / "corpus"
DEFAULT_CORPUS_ID = "english"


@lru_cache(maxsize=1)
def load_corpora() -> dict[str, Corpus]:
    corpora: dict[str, Corpus] = {}
    for path in sorted(CORPUS_DIR.glob("*.json")):
        with path.open("r", encoding="utf-8") as handle:
            corpus = Corpus.model_validate(json.load(handle))
        corpora[corpus.id] = corpus
    return corpora


def load_corpus(corpus_id: str = DEFAULT_CORPUS_ID) -> Corpus:
    return load_corpora()[corpus_id]


def get_token(corpus_id: str, token_id: str) -> CorpusToken:
    corpus = load_corpus(corpus_id)
    for token in corpus.tokens:
        if token.id == token_id:
            return token
    raise KeyError(token_id)
