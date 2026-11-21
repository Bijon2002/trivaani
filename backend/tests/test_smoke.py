import pytest
import json
from starlette.testclient import TestClient
from backend.main import app

def test_walking_skeleton_smoke_flow():
    """
    Phase 1 Smoke Test:
    Spoken sentence fills field in UI state, audio/text reply returns,
    and end-to-end demo path completes without crashing.
    """
    client = TestClient(app)
    
    with client.websocket_connect("/ws/session?service_id=birth_certificate&language=si") as websocket:
        # 1. Expect session_init
        init_data = websocket.receive_json()
        assert init_data["type"] == "session_init"
        assert init_data["service_id"] == "birth_certificate"
        assert init_data["language"] == "si"
        assert "child_full_name" in init_data["state"]["missing"]["missing_fields"][0]["id"] or len(init_data["state"]["missing"]["missing_fields"]) > 0

        # 2. Receive initial agent greeting transcript
        greeting = websocket.receive_json()
        assert greeting["type"] == "transcript"
        assert greeting["speaker"] == "agent"

        # 3. Speak name in Sinhala
        websocket.send_json({
            "type": "text",
            "text": "මගේ නම කසුන් පෙරේරා."
        })
        reply1 = websocket.receive_json()
        assert reply1["type"] == "transcript"
        assert reply1["speaker"] == "agent"
        assert reply1["updated_field"] == "child_full_name"
        assert reply1["state"]["form_data"]["child_full_name"]["value"] == "කසුන් පෙරේරා"

        # 4. Speak date of birth and district in Singlish
        websocket.send_json({
            "type": "text",
            "text": "Birth date is 1995-05-12, district Colombo."
        })
        reply2 = websocket.receive_json()
        assert reply2["type"] == "transcript"
        assert reply2["updated_field"] == "date_of_birth"
        assert reply2["state"]["form_data"]["date_of_birth"]["value"] == "1995-05-12"
        assert reply2["state"]["form_data"]["birth_district"]["value"] == "Colombo"

        # 5. Complete remaining fields and upload NIC
        websocket.send_json({
            "type": "text",
            "text": "Mother is Sunethra Silva, reason is passport application."
        })
        reply3 = websocket.receive_json()
        assert reply3["type"] == "confirmation_requested" or "confirmation_requested" in str(reply3)
        assert reply3["state"]["form_data"]["mother_full_name"]["value"] == "Sunethra Silva"

        # 6. Verify server-enforced safety guardrail (attempt submit before confirm)
        websocket.send_json({"type": "submit"})
        submit_res_blocked = websocket.receive_json()
        assert submit_res_blocked["type"] == "submit_result"
        assert submit_res_blocked["result"]["status"] == "BLOCKED"

        # 7. Citizen explicitly confirms
        websocket.send_json({"type": "confirm"})
        confirm_res = websocket.receive_json()
        assert confirm_res["type"] == "confirmed"
        assert confirm_res["state"]["confirmed"] is True

        # 8. Submit now succeeds
        # First ensure mandatory NIC is simulated as recorded
        state_dict = confirm_res["state"]
        sid = state_dict["session_id"]
        from backend.main import sessions
        sessions[sid].record_document("applicant_nic", {"applicant_nic": "199512345678"})
        sessions[sid].user_confirm()

        websocket.send_json({"type": "submit"})
        submit_res_ok = websocket.receive_json()
        assert submit_res_ok["type"] == "submit_result"
        assert submit_res_ok["result"]["status"] == "SUCCESS"
        assert submit_res_ok["result"]["submission_id"].startswith("TRIV-")
