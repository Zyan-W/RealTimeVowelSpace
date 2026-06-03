from app.corpus import CORPUS_DIR, load_corpora, load_corpus


def test_corpus_has_unique_token_ids():
    corpus = load_corpus()
    ids = [token.id for token in corpus.tokens]
    assert len(ids) == len(set(ids))
    assert corpus.version
    assert len(corpus.tokens) >= 8


def test_tokens_have_reference_regions_and_analysis_hints():
    for corpus in load_corpora().values():
        reference_ids = {reference.id for reference in corpus.referenceSets}
        for token in corpus.tokens:
            assert token.display
            assert token.vowel
            assert set(token.references) == reference_ids
            reference = next(iter(token.references.values()))
            assert 200 <= reference.f1 <= 1000
            assert 600 <= reference.f2 <= 3000
            assert 40 <= token.analysis.windowMs <= 300


def test_american_and_british_english_are_separate_systems():
    american = load_corpus("american-english")
    british = load_corpus("british-english")
    american_tokens = {token.id: token for token in american.tokens}
    british_tokens = {token.id: token for token in british.tokens}

    assert "hayed" not in american_tokens
    assert "hayed" not in british_tokens
    assert american_tokens["hod"].vowel == "LOT-PALM"
    assert british_tokens["hod"].vowel == "LOT"
    assert british_tokens["hard"].vowel == "BATH-PALM-START"
    assert american_tokens["heard"].ipa == "/\u025d/"
    assert british_tokens["heard"].ipa == "/\u025c\u02d0/"


def test_japanese_corpus_has_five_vowels():
    corpus = load_corpus("japanese")
    assert corpus.language == "Japanese"
    assert [token.vowel for token in corpus.tokens] == ["a", "i", "u", "e", "o"]
    assert all("native" in token.references for token in corpus.tokens)


def test_load_corpora_returns_language_map():
    corpora = load_corpora()
    assert {"american-english", "british-english", "japanese"} <= set(corpora)


def test_corpus_json_files_are_ascii_escaped():
    for path in CORPUS_DIR.glob("*.json"):
        assert path.read_bytes().isascii()
