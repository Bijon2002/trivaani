import re
from typing import Dict, Any
from backend.session_state import SessionState

class GuardrailBlockedException(Exception):
    """Raised when a safety rule or guardrail check fails."""
    def __init__(self, message: str, code: str = "GUARDRAIL_BLOCKED"):
        self.message = message
        self.code = code
        super().__init__(self.message)

def check_submit_guardrail(state: SessionState) -> Dict[str, Any]:
    """
    Enforces server-side guardrails before submission.
    The model CANNOT submit an application unless:
    1. state.confirmed == True (citizen explicitly confirmed via UI/consent modal).
    2. Missing mandatory fields and documents are resolved.
    """
    # 1. Check citizen confirmation
    if not state.confirmed:
        raise GuardrailBlockedException(
            "GUARDRAIL_BLOCKED: Submission rejected. Citizen confirmation is required before submitting. "
            "Call request_confirmation() first and wait for the citizen to review and confirm."
        )

    # 2. Check completeness
    missing = state.get_missing()
    if not missing["is_complete"]:
        missing_names = [f["id"] for f in missing["missing_fields"]]
        missing_doc_types = [d["doc_type"] for d in missing["missing_documents"]]
        details = []
        if missing_names:
            details.append(f"Missing fields: {', '.join(missing_names)}")
        if missing_doc_types:
            details.append(f"Missing documents: {', '.join(missing_doc_types)}")
        raise GuardrailBlockedException(
            f"GUARDRAIL_BLOCKED: Application is incomplete. {'; '.join(details)}"
        )

    return {
        "status": "APPROVED",
        "session_id": state.session_id,
        "confirmed": True
    }

def redact_sensitive_text(text: str) -> str:
    """
    Redacts personally identifiable information (NIC numbers, phone numbers)
    from text logs and audit storage.
    """
    if not text:
        return text

    # Redact 12-digit new NIC (e.g. 199512345678 -> 1995****5678)
    text = re.sub(r'\b(\d{4})\d{4}(\d{4})\b', r'\1****\2', text)

    # Redact 9-digit + V/X old NIC (e.g. 951234567V -> 95****567V)
    text = re.sub(r'\b(\d{2})\d{4}(\d{3}[vVxX])\b', r'\1****\2', text)

    # Redact 10-digit Sri Lankan phone numbers (e.g. 0771234567 -> 077****567)
    text = re.sub(r'\b(07\d)\d{4}(\d{3})\b', r'\1****\2', text)

    return text
