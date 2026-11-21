import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app, sessions

@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

@pytest.mark.asyncio
async def test_get_services_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/services")
    assert response.status_code == 200
    services = response.json()["services"]
    ids = [s["service_id"] for s in services]
    assert "birth_certificate" in ids

@pytest.mark.asyncio
async def test_get_service_detail():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/services/birth_certificate")
    assert response.status_code == 200
    assert response.json()["service_id"] == "birth_certificate"

@pytest.mark.asyncio
async def test_field_update_and_confirm_flow():
    transport = ASGITransport(app=app)
    sid = "test-session-flow"
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Update field
        res1 = await ac.post(f"/api/session/{sid}/field", json={
            "field_id": "child_full_name",
            "value": "Anura Kumara",
            "source": "manual"
        })
        assert res1.status_code == 200
        assert res1.json()["state"]["form_data"]["child_full_name"]["value"] == "Anura Kumara"

        # Try to submit before confirm - must be rejected
        res2 = await ac.post(f"/api/session/{sid}/submit")
        assert res2.status_code == 403

        # Confirm
        res3 = await ac.post(f"/api/session/{sid}/confirm")
        assert res3.status_code == 200
        assert res3.json()["confirmed"] is True

        # Check audit trail
        res4 = await ac.get(f"/api/session/{sid}/audit")
        assert res4.status_code == 200
        events = res4.json()["events"]
        assert len(events) >= 2
