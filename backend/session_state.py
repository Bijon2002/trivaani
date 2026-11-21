from typing import Dict, Any, List, Optional
import time
import uuid
from pydantic import BaseModel, Field
from backend.config_loader import load_service_config, ServiceConfig

class FieldValue(BaseModel):
    value: Any
    source: str = "voice"  # "voice", "vision", "manual"
    confidence: float = 1.0
    updated_at: float = Field(default_factory=time.time)

class DocumentInfo(BaseModel):
    doc_type: str
    uploaded: bool = True
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    uploaded_at: float = Field(default_factory=time.time)

class SessionState:
    def __init__(self, session_id: Optional[str] = None, service_id: str = "birth_certificate", language: str = "en"):
        self.session_id: str = session_id or str(uuid.uuid4())
        self.service_id: str = service_id
        self.language: str = language
        self.config: ServiceConfig = load_service_config(service_id)
        self.form_data: Dict[str, FieldValue] = {}
        self.uploaded_documents: Dict[str, DocumentInfo] = {}
        self.confirmation_requested: bool = False
        self.confirmation_summary: Optional[str] = None
        self.confirmed: bool = False
        self.submitted: bool = False
        self.submission_id: Optional[str] = None
        self.created_at: float = time.time()
        self.updated_at: float = time.time()

    def set_language(self, language: str) -> None:
        if language in ["en", "si", "ta"]:
            self.language = language
            self.updated_at = time.time()

    def set_field(self, field_id: str, value: Any, source: str = "voice", confidence: float = 1.0) -> Dict[str, Any]:
        # Reset confirmation status if a field is modified after confirmation
        if self.confirmed:
            self.confirmed = False
            self.confirmation_requested = False

        self.form_data[field_id] = FieldValue(
            value=value,
            source=source,
            confidence=confidence,
            updated_at=time.time()
        )
        self.updated_at = time.time()
        return {
            "field_id": field_id,
            "value": value,
            "source": source,
            "confidence": confidence
        }

    def record_document(self, doc_type: str, extracted_fields: Dict[str, Any], confidence: float = 1.0) -> None:
        self.uploaded_documents[doc_type] = DocumentInfo(
            doc_type=doc_type,
            uploaded=True,
            extracted_fields=extracted_fields,
            confidence=confidence,
            uploaded_at=time.time()
        )
        for field_id, val in extracted_fields.items():
            self.set_field(field_id=field_id, value=val, source="vision", confidence=confidence)
        self.updated_at = time.time()

    def get_missing(self) -> Dict[str, Any]:
        missing_fields = []
        for field in self.config.fields:
            if field.required:
                current_entry = self.form_data.get(field.id)
                if not current_entry or current_entry.value is None or str(current_entry.value).strip() == "":
                    missing_fields.append({
                        "id": field.id,
                        "label": field.label.get(self.language),
                        "hint": field.hint.get(self.language) if field.hint else None
                    })

        missing_docs = []
        for doc in self.config.required_documents:
            if doc.mandatory:
                if doc.doc_type not in self.uploaded_documents:
                    missing_docs.append({
                        "doc_type": doc.doc_type,
                        "title": doc.title.get(self.language),
                        "description": doc.description.get(self.language)
                    })

        is_complete = (len(missing_fields) == 0 and len(missing_docs) == 0)
        return {
            "is_complete": is_complete,
            "missing_fields": missing_fields,
            "missing_documents": missing_docs,
            "filled_fields_count": len(self.form_data),
            "total_required_fields": len([f for f in self.config.fields if f.required])
        }

    def request_confirmation(self, summary: Optional[str] = None) -> Dict[str, Any]:
        missing = self.get_missing()
        self.confirmation_requested = True
        self.confirmation_summary = summary
        self.updated_at = time.time()
        return {
            "confirmation_requested": True,
            "summary": summary,
            "is_complete": missing["is_complete"],
            "missing_fields": missing["missing_fields"],
            "missing_documents": missing["missing_documents"],
            "current_data": {k: v.value for k, v in self.form_data.items()}
        }

    def user_confirm(self) -> Dict[str, Any]:
        """User confirms the application from the UI modal or explicit confirmation voice."""
        self.confirmed = True
        self.updated_at = time.time()
        return {
            "session_id": self.session_id,
            "confirmed": True,
            "timestamp": self.updated_at
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "service_id": self.service_id,
            "language": self.language,
            "form_data": {k: {"value": v.value, "source": v.source, "confidence": v.confidence} for k, v in self.form_data.items()},
            "uploaded_documents": list(self.uploaded_documents.keys()),
            "confirmation_requested": self.confirmation_requested,
            "confirmation_summary": self.confirmation_summary,
            "confirmed": self.confirmed,
            "submitted": self.submitted,
            "submission_id": self.submission_id,
            "missing": self.get_missing()
        }
