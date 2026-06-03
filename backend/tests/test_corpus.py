from app.corpus import CORPUS_DIR, load_corpora, load_corpus


def test_corpus_has_unique_token_ids():
    corpus = load_corpus()
    ids = [token.id for token in corpus.tokens]
    assert len(ids) == len(set(ids))
    assert corpus.version
    assert len(corpus.tokens) >= 8


def test_tokens_have_reference_regions_and_analysis_hints():
    for token in load_corpus().tokens:
        assert token.display
        assert token.vowel
        assert {"american", "british"} <= set(token.references)
        reference = token.references["american"]
        assert 200 <= reference.f1 <= 1000
        assert 600 <= reference.f2 <= 3000
        assert 40 <= token.analysis.windowMs <= 300


def test_english_removes_diphthong_token():
    corpus = load_corpus("english")
    assert "hayed" not in {token.id for token in corpus.tokens}


def test_japanese_corpus_has_five_vowels():
    corpus = load_corpus("japanese")
    assert corpus.language == "Japanese"
    assert [token.vowel for token in corpus.tokens] == ["a", "i", "u", "e", "o"]
    assert all("native" in token.references for token in corpus.tokens)


def test_load_corpora_returns_language_map():
    corpora = load_corpora()
    assert {"english", "japanese"} <= set(corpora)


def test_corpus_json_files_are_ascii_escaped():
    for path in CORPUS_DIR.glob("*.json"):
        assert path.read_bytes().isascii()
