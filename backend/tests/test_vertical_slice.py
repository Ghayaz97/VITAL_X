from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_session_and_clinical_claim():
    session = client.post("/api/v1/sessions", json={"language_code": "en-IN"})
    assert session.status_code == 200
    sid = session.json()["session_id"]

    consent = client.post(f"/api/v1/sessions/{sid}/consents", json={"purpose": "history_capture", "status": "granted"})
    assert consent.status_code == 200

    patient = client.post(f"/api/v1/sessions/{sid}/patient", json={"name": "Demo Patient", "age": 30, "sex": "F", "preferred_language": "en-IN"})
    assert patient.status_code == 200

    answer = client.post(f"/api/v1/sessions/{sid}/answers", json={"question_id": "chief_complaint", "raw_text": "I have chest pain since 1 day", "input_mode": "touch", "language_code": "en-IN"})
    assert answer.status_code == 200
    assert answer.json()["claim"]["concept_code"] == "symptom.chest_pain"
