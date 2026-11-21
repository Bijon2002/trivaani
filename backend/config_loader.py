import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

SERVICES_DIR = Path(__file__).resolve().parent.parent / "services"

class LocalizedString(BaseModel):
    en: str
    si: str
    ta: str

    def get(self, lang: str = "en") -> str:
        if lang == "si":
            return self.si
        elif lang == "ta":
            return self.ta
        return self.en

class RequiredDocument(BaseModel):
    doc_type: str
    mandatory: bool = True
    title: LocalizedString
    description: LocalizedString
    extractable_fields: List[str] = Field(default_factory=list)

class FormField(BaseModel):
    id: str
    type: str  # text, date, select, tel, etc.
    required: bool = True
    label: LocalizedString
    hint: Optional[LocalizedString] = None
    options: Optional[List[str]] = None

class ServiceConfig(BaseModel):
    service_id: str
    is_illustrative: bool = False
    title: LocalizedString
    department: LocalizedString
    description: LocalizedString
    supported_languages: List[str] = Field(default_factory=lambda: ["si", "ta", "en"])
    required_documents: List[RequiredDocument] = Field(default_factory=list)
    fields: List[FormField] = Field(default_factory=list)

def load_service_config(service_id: str = "birth_certificate", directory: Optional[Path] = None) -> ServiceConfig:
    search_dir = directory or SERVICES_DIR
    config_file = search_dir / f"{service_id}.json"
    if not config_file.exists():
        # Fallback to search all json files for matching service_id
        for file in search_dir.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("service_id") == service_id:
                        return ServiceConfig(**data)
            except Exception:
                continue
        raise FileNotFoundError(f"Service configuration not found for service_id: '{service_id}' in {search_dir}")
    
    with open(config_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return ServiceConfig(**data)

def list_available_services(directory: Optional[Path] = None) -> List[Dict[str, Any]]:
    search_dir = directory or SERVICES_DIR
    services = []
    for file in search_dir.glob("*.json"):
        try:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
                services.append({
                    "service_id": data.get("service_id"),
                    "title": data.get("title", {}),
                    "is_illustrative": data.get("is_illustrative", False)
                })
        except Exception:
            continue
    return services
