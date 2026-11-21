import pytest
from pathlib import Path
from backend.config_loader import load_service_config, list_available_services

def test_load_birth_certificate_config():
    config = load_service_config("birth_certificate")
    assert config.service_id == "birth_certificate"
    assert config.title.en == "Birth Certificate Copy Request"
    assert config.title.si == "උප්පැන්න සහතික පිටපත් ඉල්ලුම්පත්‍රය"
    assert config.title.ta == "பிறப்புச் சான்றிதழ் பிரதி விண்ணப்பம்"
    
    # Verify required documents
    assert len(config.required_documents) >= 1
    nic_doc = next(d for d in config.required_documents if d.doc_type == "applicant_nic")
    assert nic_doc.mandatory is True
    assert "applicant_nic" in nic_doc.extractable_fields
    
    # Verify fields
    field_ids = [f.id for f in config.fields]
    assert "child_full_name" in field_ids
    assert "date_of_birth" in field_ids
    assert "applicant_nic" in field_ids
    assert "applicant_phone" in field_ids
    assert "reason_for_copy" in field_ids

def test_load_illustrative_config():
    config = load_service_config("illustrative_water_connection")
    assert config.is_illustrative is True
    assert config.title.en == "Community Water Connection Request (Illustrative)"
    assert len(config.fields) > 0

def test_list_available_services():
    services = list_available_services()
    service_ids = [s["service_id"] for s in services]
    assert "birth_certificate" in service_ids
    assert "illustrative_water_connection" in service_ids

def test_missing_config_raises_error():
    with pytest.raises(FileNotFoundError):
        load_service_config("non_existent_service_12345")
