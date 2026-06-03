from app.corpus import load_corpus


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
        assert 200 <= token.reference.f1 <= 1000
        assert 600 <= token.reference.f2 <= 3000
        assert 40 <= token.analysis.windowMs <= 300
