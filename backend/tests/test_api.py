from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_corpus_endpoint_shape():
    client = TestClient(app)
    response = client.get("/api/corpus")
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "English"
    assert body["tokens"][0]["word"]
    assert body["tokens"][0]["references"]["american"]["f1"]


def test_corpora_endpoint_returns_english_and_japanese():
    client = TestClient(app)
    response = client.get("/api/corpora")
    assert response.status_code == 200
    corpus_ids = {item["id"] for item in response.json()}
    assert {"english", "japanese"} <= corpus_ids
