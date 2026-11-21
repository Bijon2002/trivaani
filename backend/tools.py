from typing import Dict, Any, List
import uuid
from backend.session_state import SessionState
from backend.guardrails import check_submit_guardrail, GuardrailBlockedException
from backend.audit import audit_logger

TOOL_DECLARATIONS = [
    {
        "name": "get_service_requirements",
        "description": "Returns the required form fields, localized labels, and mandatory supporting documents for a government service.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "service_id": {
                    "type": "STRING",
                    "description": "The unique identifier of the service (e.g. 'birth_certificate')."
                }
            },
            "required": ["service_id"]
        }
    },
    {
        "name": "set_form_field",
        "description": "Sets or updates a specific field on the citizen's form. Highlights the field in the user interface.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "field_id": {
                    "type": "STRING",
                    "description": "Identifier of the field (e.g. 'child_full_name', 'date_of_birth', 'birth_district', 'applicant_nic')."
                },
                "value": {
                    "type": "STRING",
                    "description": "The value provided by the citizen."
                },
                "source": {
                    "type": "STRING",
                    "description": "Source of information: 'voice', 'vision', or 'manual'. Defaults to 'voice'."
                }
            },
            "required": ["field_id", "value"]
        }
    },
    {
        "name": "read_document",
        "description": "Prompts the user interface to capture or upload a photo of a supporting document (such as NIC) for OCR extraction.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "doc_type": {
                    "type": "STRING",
                    "description": "The type of document to capture (e.g. 'applicant_nic' or 'birth_record_slip')."
                }
            },
            "required": ["doc_type"]
        }
    },
    {
        "name": "check_missing",
        "description": "Checks the current form state for any unfilled required fields or missing mandatory documents.",
        "parameters": {
            "type": "OBJECT",
            "properties": {}
        }
    },
    {
        "name": "request_confirmation",
        "description": "Opens the review and confirmation modal in the citizen's UI with a summary of all entered details.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "summary": {
                    "type": "STRING",
                    "description": "A clear spoken summary of key details for the citizen to review."
                }
            },
            "required": ["summary"]
        }
    },
    {
        "name": "submit_application",
        "description": "Submits the finalized application. BLOCKED by server guardrails if citizen has not confirmed.",
        "parameters": {
            "type": "OBJECT",
            "properties": {}
        }
    }
]

async def execute_tool(name: str, args: Dict[str, Any], state: SessionState) -> Dict[str, Any]:
    """Executes a function call requested by the Gemini model."""
    if name == "get_service_requirements":
        service_id = args.get("service_id", state.service_id)
        config = state.config
        await audit_logger.log_event(state.session_id, "GET_SERVICE_REQUIREMENTS", "agent", {"service_id": service_id})
        return {
            "service_id": config.service_id,
            "title": config.title.get(state.language),
            "department": config.department.get(state.language),
            "fields": [
                {
                    "id": f.id,
                    "label": f.label.get(state.language),
                    "required": f.required,
                    "type": f.type,
                    "options": f.options
                }
                for f in config.fields
            ],
            "required_documents": [
                {
                    "doc_type": d.doc_type,
                    "title": d.title.get(state.language),
                    "mandatory": d.mandatory
                }
                for d in config.required_documents
            ]
        }

    elif name == "set_form_field":
        field_id = args.get("field_id")
        value = args.get("value")
        source = args.get("source", "voice")
        res = state.set_field(field_id=field_id, value=value, source=source)
        await audit_logger.log_event(state.session_id, "FIELD_SET", "agent", res)
        return {"status": "SUCCESS", "updated_field": res}

    elif name == "read_document":
        doc_type = args.get("doc_type")
        await audit_logger.log_event(state.session_id, "DOC_READ_TRIGGERED", "agent", {"doc_type": doc_type})
        return {
            "status": "CAPTURE_TRIGGERED",
            "doc_type": doc_type,
            "message": f"Camera prompt displayed in UI for document type: {doc_type}"
        }

    elif name == "check_missing":
        missing = state.get_missing()
        await audit_logger.log_event(state.session_id, "MISSING_CHECKED", "agent", missing)
        return missing

    elif name == "request_confirmation":
        summary = args.get("summary", "")
        res = state.request_confirmation(summary=summary)
        await audit_logger.log_event(state.session_id, "CONFIRM_REQUESTED", "agent", {"summary": summary})
        return res

    elif name == "submit_application":
        try:
            # Enforce server-side safety guardrail
            check_submit_guardrail(state)
            submission_ref = f"TRIV-{uuid.uuid4().hex[:8].upper()}"
            state.submitted = True
            state.submission_id = submission_ref
            await audit_logger.log_event(state.session_id, "SUBMITTED", "server", {
                "submission_id": submission_ref,
                "service_id": state.service_id
            })
            return {
                "status": "SUCCESS",
                "message": "Application successfully submitted.",
                "submission_id": submission_ref
            }
        except GuardrailBlockedException as e:
            await audit_logger.log_event(state.session_id, "GUARDRAIL_BLOCKED", "server", {"error": str(e)})
            return {
                "status": "BLOCKED",
                "error": str(e)
            }

    else:
        return {"status": "ERROR", "message": f"Unknown tool: {name}"}
