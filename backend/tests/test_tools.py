import pytest
from backend.session_state import SessionState
from backend.tools import execute_tool

@pytest.mark.asyncio
async def test_get_service_requirements_tool():
    state = SessionState()
    res = await execute_tool("get_service_requirements", {"service_id": "birth_certificate"}, state)
    assert res["service_id"] == "birth_certificate"
    assert "fields" in res
    assert "required_documents" in res
    assert len(res["fields"]) > 0

@pytest.mark.asyncio
async def test_set_form_field_tool():
    state = SessionState()
    res = await execute_tool("set_form_field", {
        "field_id": "child_full_name",
        "value": "Nimal Perera",
        "source": "voice"
    }, state)
    assert res["status"] == "SUCCESS"
    assert state.form_data["child_full_name"].value == "Nimal Perera"
    assert state.form_data["child_full_name"].source == "voice"

@pytest.mark.asyncio
async def test_check_missing_tool():
    state = SessionState()
    res = await execute_tool("check_missing", {}, state)
    assert res["is_complete"] is False
    assert len(res["missing_fields"]) > 0
    assert len(res["missing_documents"]) > 0

@pytest.mark.asyncio
async def test_request_confirmation_tool():
    state = SessionState()
    res = await execute_tool("request_confirmation", {
        "summary": "Reviewing application for Nimal Perera."
    }, state)
    assert res["confirmation_requested"] is True
    assert state.confirmation_requested is True
    assert state.confirmation_summary == "Reviewing application for Nimal Perera."

@pytest.mark.asyncio
async def test_submit_application_tool_blocked_without_confirm():
    state = SessionState()
    res = await execute_tool("submit_application", {}, state)
    assert res["status"] == "BLOCKED"
    assert "Citizen confirmation is required" in res["error"]
    assert state.submitted is False

@pytest.mark.asyncio
async def test_submit_application_tool_success_when_confirmed_and_complete():
    state = SessionState()
    # Populate all required fields
    for field in state.config.fields:
        if field.required:
            state.set_field(field.id, "Valid Data")
    # Record required document
    state.record_document("applicant_nic", {"applicant_nic": "199512345678"})
    
    # Confirm
    state.user_confirm()

    res = await execute_tool("submit_application", {}, state)
    assert res["status"] == "SUCCESS"
    assert res["submission_id"].startswith("TRIV-")
    assert state.submitted is True
