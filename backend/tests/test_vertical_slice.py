from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db
from app.schemas.verification import VerificationIn
from app.services.provenance import create_provenance

# Ensure database tables exist
init_db()


def test_import_contracts():
    """Verify non-negotiable import signatures required by system specification."""
    assert VerificationIn is not None
    prov = create_provenance(source_type="patient_voice", source_id="TEST-01")
    assert prov["source_type"] == "patient_voice"


def test_end_to_end_sih_golden_path():
    with TestClient(app) as client:
        # 1. Create session (Kannada language intake)
        res_session = client.post("/api/v1/sessions", json={
            "patient_id": "PT-SIH-042",
            "language": "kn-IN",
            "consent_given": True
        })
        assert res_session.status_code == 201
        sid = res_session.json()["session_id"]

        # 2. Record patient verbal statement claim ("Joint pain, no history of diabetes")
        res_claim1 = client.post(f"/api/v1/sessions/{sid}/claims", json={
            "category": "clinical",
            "concept_code": "condition.diabetes",
            "value": "No Diabetes",
            "source_type": "patient_voice",
            "source_id": "SRC-VOICE-01",
            "evidence_text": "Patient verbal report: No history of diabetes",
            "language_code": "kn-IN",
            "input_mode": "voice"
        })
        assert res_claim1.status_code == 200
        assert res_claim1.json()["truth_evaluation"]["status"] == "CLEAR"
        assert res_claim1.json()["truth_evaluation"]["export_blocked"] is False

        # 3. Upload Mock Prescription Document (generates contradictory claim: Type 2 Diabetes Active)
        res_doc = client.post(f"/api/v1/sessions/{sid}/documents/mock-upload")
        assert res_doc.status_code == 200
        assert res_doc.json()["truth_evaluation"]["status"] == "CONFLICT"
        assert res_doc.json()["truth_evaluation"]["export_blocked"] is True

        # 4. Save AYUSH Dashavidha Assessment
        res_ayush = client.post(f"/api/v1/sessions/{sid}/ayush", json={
            "prakriti": "Vata-Pitta",
            "vikriti": "Vata Kopa",
            "sara": "Madhyama",
            "vaya": "Madhyama (35 yrs)"
        })
        assert res_ayush.status_code == 200
        assert res_ayush.json()["ayush_assessment"]["prakriti"] == "Vata-Pitta"

        # 5. Attempt FHIR Export while conflict is active (must fail with HTTP 409 EXPORT_BLOCKED)
        res_fhir_blocked = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir_blocked.status_code == 409

        # 6. Practitioner Queue check
        res_queue = client.get("/api/v1/doctor/queue")
        assert res_queue.status_code == 200
        queue = res_queue.json()
        assert any(q["session_id"] == sid and q["truth_status"] == "CONFLICT" for q in queue)

        # 7. Doctor Case details check
        res_case = client.get(f"/api/v1/doctor/cases/{sid}")
        assert res_case.status_code == 200
        assert len(res_case.json()["claims"]) == 2
        assert res_case.json()["ayush_assessment"]["prakriti"] == "Vata-Pitta"

        # 8. Practitioner resolves conflict by accepting the document claim and rejecting patient claim
        claim1_id = res_claim1.json()["claim_id"]
        res_verify = client.post(f"/api/v1/sessions/{sid}/verify", json={
            "claim_id": claim1_id,
            "action": "reject_claim",
            "practitioner_id": "DR-AYUSH-01",
            "comment": "Overridden by historical prescription record (Metformin 2025)"
        })
        assert res_verify.status_code == 200
        assert res_verify.json()["truth_evaluation"]["status"] == "CLEAR"
        assert res_verify.json()["truth_evaluation"]["export_blocked"] is False

        # 9. FHIR Export now succeeds
        res_fhir = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir.status_code == 200
        bundle = res_fhir.json()
        assert bundle["resourceType"] == "Bundle"
        assert len(bundle["entry"]) >= 3

        # 10. Reset session demo test
        res_reset = client.post(f"/api/v1/sessions/{sid}/reset")
        assert res_reset.status_code == 200
        res_case_after_reset = client.get(f"/api/v1/doctor/cases/{sid}")
        assert len(res_case_after_reset.json()["claims"]) == 0
