import pytest
from backend.session_state import SessionState
from backend.guardrails import check_submit_guardrail, GuardrailBlockedException, redact_sensitive_text

def test_submit_without_confirm_is_blocked():
    state = SessionState()
    # Populate all fields
    for field in state.config.fields:
        state.set_field(field.id, "Test Value")
    state.record_document("applicant_nic", {"applicant_nic": "199512345678"})

    # State is not confirmed
    assert state.confirmed is False
    with pytest.raises(GuardrailBlockedException) as exc_info:
        check_submit_guardrail(state)
    assert "Citizen confirmation is required" in str(exc_info.value)

def test_submit_with_missing_fields_is_blocked():
    state = SessionState()
    # Confirm before filling everything
    state.user_confirm()
    assert state.confirmed is True

    # Missing fields must block submit
    with pytest.raises(GuardrailBlockedException) as exc_info:
        check_submit_guardrail(state)
    assert "Application is incomplete" in str(exc_info.value)

def test_submit_when_confirmed_and_complete_succeeds():
    state = SessionState()
    # Fill all required fields
    for field in state.config.fields:
        if field.required:
            state.set_field(field.id, "Valid Data")
    # Upload mandatory documents
    state.record_document("applicant_nic", {"applicant_nic": "199512345678"})

    missing = state.get_missing()
    assert missing["is_complete"] is True

    # User confirms
    state.user_confirm()
    result = check_submit_guardrail(state)
    assert result["status"] == "APPROVED"
    assert result["confirmed"] is True

def test_field_edit_after_confirm_resets_confirmation():
    state = SessionState()
    state.user_confirm()
    assert state.confirmed is True

    # Modifying any field must revoke confirmation
    state.set_field("child_full_name", "New Name")
    assert state.confirmed is False

def test_redact_sensitive_text():
    # 12-digit new NIC
    raw_12 = "Citizen NIC is 199012345678 registered."
    assert redact_sensitive_text(raw_12) == "Citizen NIC is 1990****5678 registered."

    # 9-digit old NIC with V
    raw_old = "Old NIC 921234567V submitted."
    assert redact_sensitive_text(raw_old) == "Old NIC 92****567V submitted."

    # Phone number
    raw_phone = "Contact number 0771234567 for applicant."
    assert redact_sensitive_text(raw_phone) == "Contact number 077****567 for applicant."
