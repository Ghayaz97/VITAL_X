import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db
from app.schemas.verification import VerificationIn
from app.services.provenance import create_provenance

init_db()


def test_01_health_check():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


def test_02_session_creation():
    with TestClient(app) as client:
        res = client.post("/api/v1/sessions", json={"patient_id": "PT-T02", "language": "kn-IN", "consent_given": True})
        assert res.status_code == 201
        assert "session_id" in res.json()


def test_03_consent_enforcement_and_gating():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-NOCONSENT", "consent_given": False}).json()
        sid = sess["session_id"]
        res_fhir = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir.status_code == 409
        assert res_fhir.json()["detail"]["error"] == "EXPORT_BLOCKED"


def test_04_patient_identification_abha():
    with TestClient(app) as client:
        res = client.post("/api/v1/sessions", json={"patient_id": "PT-ABHA-123", "abha_id": "91-042-4242", "language": "hi-IN"})
        assert res.status_code == 201
        assert res.json()["patient_id"] == "PT-ABHA-123"


def test_05_interview_adaptive_questioning():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-INT-01", "consent_given": True}).json()
        sid = sess["session_id"]
        res_q = client.get(f"/api/v1/sessions/{sid}/interview/next")
        assert res_q.status_code == 200
        assert "step" in res_q.json()


def test_06_multilingual_input_kn_hi_en():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-LANG-01", "language": "kn-IN", "consent_given": True}).json()
        sid = sess["session_id"]
        res_ans = client.post(f"/api/v1/sessions/{sid}/interview/answer", json={"step_id": "chief_complaint", "answer_text": "ನನ್ನ ಮೊಣಕಾಲಿನಲ್ಲಿ ನೋವು ಇದೆ", "language_code": "kn-IN"})
        assert res_ans.status_code == 200


def test_07_red_flag_safety_routing_urgent_signal():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-URGENT-01", "consent_given": True}).json()
        sid = sess["session_id"]
        res_ans = client.post(f"/api/v1/sessions/{sid}/interview/answer", json={"step_id": "chief_complaint", "answer_text": "I have severe chest pain and difficulty breathing"})
        assert res_ans.status_code == 200
        data = res_ans.json()
        assert data["routing_state"] == "URGENT"
        assert len(data["safety_signals"]) > 0
        assert data["safety_signals"][0]["severity"] == "URGENT"


def test_08_document_upload_and_ocr_extraction():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-OCR-01", "consent_given": True}).json()
        sid = sess["session_id"]
        res_doc = client.post(f"/api/v1/sessions/{sid}/documents/mock-upload")
        assert res_doc.status_code == 200
        assert "document_id" in res_doc.json()


def test_09_lab_safety_out_of_range_flag():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-LAB-01", "consent_given": True}).json()
        sid = sess["session_id"]
        res_doc = client.post(f"/api/v1/sessions/{sid}/documents/mock-upload")
        assert len(res_doc.json()["lab_safety_flags"]) > 0


def test_10_claim_creation_and_provenance():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-CLM-01", "consent_given": True}).json()
        sid = sess["session_id"]
        res_c = client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "symptom.fever", "value": "Fever", "source_type": "patient_voice", "evidence_text": "I have fever"})
        assert res_c.status_code == 200
        assert "claim_id" in res_c.json()


def test_11_evidence_persistence_and_hashing():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-EV-01", "consent_given": True}).json()
        sid = sess["session_id"]
        client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "symptom.fever", "value": "Fever", "evidence_text": "Fever 3 days"})
        res_ev = client.get(f"/api/v1/sessions/{sid}/evidence")
        assert len(res_ev.json()) >= 1
        assert "content_hash" in res_ev.json()[0]


def test_12_contradiction_detection_voice_vs_prescription():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-GOLDEN-01", "consent_given": True}).json()
        sid = sess["session_id"]
        client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "condition.diabetes", "value": "No Diabetes", "source_type": "patient_voice", "evidence_text": "I don't have diabetes"})
        res_doc = client.post(f"/api/v1/sessions/{sid}/documents/mock-upload")
        assert res_doc.json()["truth_evaluation"]["status"] == "CONFLICT"


def test_13_multiple_contradictions():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/C")
        assert res.status_code == 200
        assert res.json()["truth_state"]["unresolved_conflicts"] >= 2


def test_14_unknown_surgical_history_state():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/D")
        assert res.status_code == 200
        assert res.json()["claims_count"] >= 2


def test_15_practitioner_accept_claim():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-ACCEPT-01", "consent_given": True}).json()
        sid = sess["session_id"]
        c1 = client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "symptom.joint_pain", "value": "Joint Pain"}).json()
        res_v = client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": c1["claim_id"], "action": "accept_claim"})
        assert res_v.json()["claim_state"] == "VERIFIED"


def test_16_practitioner_reject_claim_does_not_autoverify_contradiction():
    """INVARIANT: Rejecting Claim A marks A REJECTED, but Claim B remains UNVERIFIED until explicitly accepted."""
    with TestClient(app) as client:
        res_demo = client.post("/api/v1/demo/load/B").json()
        sid = res_demo["session_id"]
        case = client.get(f"/api/v1/doctor/cases/{sid}").json()
        claim_a = case["claims"][0] # Voice claim "No Diabetes"
        claim_b = case["claims"][1] # Document claim "Metformin"

        # Reject Claim A
        res_v = client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": claim_a["claim_id"], "action": "reject_claim"}).json()
        assert res_v["new_verification_status"] == "PRACTITIONER_REJECT"

        # Check that Claim B remains UNVERIFIED until explicitly accepted
        case_updated = client.get(f"/api/v1/doctor/cases/{sid}").json()
        b_updated = [c for c in case_updated["claims"] if c["claim_id"] == claim_b["claim_id"]][0]
        assert b_updated["claim_state"] in ("UNVERIFIED", "SUPPORTED")

        # Now explicitly accept Claim B
        res_v_b = client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": claim_b["claim_id"], "action": "accept_claim"}).json()
        assert res_v_b["claim_state"] == "VERIFIED"


def test_17_practitioner_keep_both():
    with TestClient(app) as client:
        res_demo = client.post("/api/v1/demo/load/B").json()
        sid = res_demo["session_id"]
        case = client.get(f"/api/v1/doctor/cases/{sid}").json()
        cid = case["claims"][0]["claim_id"]
        res_v = client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": cid, "action": "keep_both"}).json()
        assert res_v["claim_state"] == "VERIFIED"


def test_18_append_only_audit_log_immutable():
    with TestClient(app) as client:
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-AUDIT-01", "consent_given": True}).json()
        sid = sess["session_id"]
        audit = client.get(f"/api/v1/sessions/{sid}/audit").json()
        assert len(audit) >= 2


def test_19_fhir_export_blocked_on_unresolved_conflict():
    with TestClient(app) as client:
        res_demo = client.post("/api/v1/demo/load/B").json()
        sid = res_demo["session_id"]
        res_fhir = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir.status_code == 409


def test_20_fhir_export_released_on_practitioner_verify():
    with TestClient(app) as client:
        res_demo = client.post("/api/v1/demo/load/B").json()
        sid = res_demo["session_id"]
        case = client.get(f"/api/v1/doctor/cases/{sid}").json()
        c_a = case["claims"][0]["claim_id"]
        c_b = case["claims"][1]["claim_id"]

        client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": c_a, "action": "reject_claim"})
        client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": c_b, "action": "accept_claim"})

        res_fhir = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir.status_code == 200
        assert res_fhir.json()["resourceType"] == "Bundle"


def test_21_demo_scenario_A_clean():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/A")
        assert res.status_code == 200


def test_22_demo_scenario_B_golden_path():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/B")
        assert res.status_code == 200


def test_23_demo_scenario_C_multiple_conflicts():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/C")
        assert res.status_code == 200


def test_24_demo_scenario_D_unknown_history():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/D")
        assert res.status_code == 200


def test_25_demo_scenario_E_agreeing_sources():
    with TestClient(app) as client:
        res = client.post("/api/v1/demo/load/E")
        assert res.status_code == 200


def test_26_session_reset_cleanliness():
    with TestClient(app) as client:
        res_demo = client.post("/api/v1/demo/load/B").json()
        sid = res_demo["session_id"]
        res_reset = client.post(f"/api/v1/sessions/{sid}/reset")
        assert res_reset.status_code == 200
        case_after = client.get(f"/api/v1/doctor/cases/{sid}").json()
        assert len(case_after["claims"]) == 0


def test_27_end_to_end_sih_golden_path_integration():
    """Complete 5-Step System Integration Test."""
    with TestClient(app) as client:
        # Step 1: IDENTIFY
        sess = client.post("/api/v1/sessions", json={"patient_id": "PT-SIH-042", "language": "kn-IN", "consent_given": True}).json()
        sid = sess["session_id"]

        # Step 2: CONVERSE
        client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "condition.diabetes", "value": "No Diabetes", "source_type": "patient_voice", "evidence_text": "I have joint pain and no history of diabetes"})

        # Step 3: SCAN
        client.post(f"/api/v1/sessions/{sid}/documents/mock-upload")

        # Step 4: SUMMARIZE & ROUTE (Must be CONFLICT & EXPORT_BLOCKED)
        truth = client.get(f"/api/v1/sessions/{sid}/truth").json()
        assert truth["status"] == "CONFLICT"
        assert truth["export_blocked"] is True

        res_fhir_blocked = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir_blocked.status_code == 409

        # Step 5: CONSULT (Practitioner Verification & Release)
        case = client.get(f"/api/v1/doctor/cases/{sid}").json()
        c_a = case["claims"][0]["claim_id"]
        c_b = case["claims"][1]["claim_id"]

        client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": c_a, "action": "reject_claim"})
        client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": c_b, "action": "accept_claim"})

        res_fhir_success = client.get(f"/api/v1/sessions/{sid}/fhir")
        assert res_fhir_success.status_code == 200
        assert res_fhir_success.json()["resourceType"] == "Bundle"


def test_28_security_error_format_and_request_id():
    with TestClient(app) as client:
        res = client.get("/api/v1/sessions/NON_EXISTENT_ID")
        assert res.status_code == 404
        err = res.json()["detail"]
        assert err["error"] == "SESSION_NOT_FOUND"
        assert "request_id" in err


def test_29_abdm_adapter_transmission():
    with TestClient(app) as client:
        s_res = client.post("/api/v1/sessions", json={"patient_id": "PT-ABDM-01", "abha_id": "91-042-4242-88", "language": "kn-IN", "consent_given": True})
        sid = s_res.json()["session_id"]
        client.post(f"/api/v1/sessions/{sid}/claims", json={"concept_code": "condition.joint_pain", "value": "Sandhigata Vata", "source_type": "patient_voice", "evidence_text": "joint pain"})
        client.post(f"/api/v1/sessions/{sid}/verify", json={"claim_id": client.get(f"/api/v1/doctor/cases/{sid}").json()["claims"][0]["claim_id"], "action": "accept_claim"})
        res = client.post(f"/api/v1/sessions/{sid}/abdm/transmit")
        assert res.status_code == 200
        assert res.json()["status"] == "TRANSMITTED_TO_SANDBOX"
        assert res.json()["abha_id"] == "91-042-4242-88"
        assert res.json()["ack_reference"] == "ABDM-ACK-MOCK-001"

