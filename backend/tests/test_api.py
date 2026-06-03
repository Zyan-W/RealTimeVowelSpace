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
    assert body["tokens"][0]["reference"]["f1"]
