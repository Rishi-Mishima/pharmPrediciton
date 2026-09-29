import json
import os
import urllib.request

import pytest


pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.getenv("RUN_INTEGRATION_TESTS") != "1",
        reason="set RUN_INTEGRATION_TESTS=1 with the full stack running",
    ),
]

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")


def get_json(url: str):
    with urllib.request.urlopen(url, timeout=10) as response:
        assert response.status == 200
        return json.load(response)


def test_frontend_serves_dashboard():
    with urllib.request.urlopen(FRONTEND_BASE_URL, timeout=10) as response:
        html = response.read().decode("utf-8")

    assert response.status == 200
    assert "<title>PharmaML</title>" in html


def test_frontend_proxies_api_health():
    health = get_json(f"{FRONTEND_BASE_URL}/api/health")

    assert health == {"status": "healthy", "model_loaded": True}


def test_seeded_drug_and_inventory_are_available():
    drugs = get_json(f"{API_BASE_URL}/drugs")
    inventory = get_json(f"{API_BASE_URL}/inventory")

    paracetamol = next(drug for drug in drugs if drug["code"] == "N02BE")
    stock = next(item for item in inventory if item["drug_id"] == paracetamol["id"])

    assert paracetamol["name"] == "Paracetamol"
    assert stock["current_stock"] == 500
    assert stock["safety_stock"] == 200


def test_seeded_drug_can_be_forecast():
    drugs = get_json(f"{API_BASE_URL}/drugs")
    drug_id = next(drug["id"] for drug in drugs if drug["code"] == "N02BE")

    request = urllib.request.Request(
        f"{API_BASE_URL}/drugs/{drug_id}/forecast",
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        forecast = json.load(response)

    assert response.status == 200
    assert forecast["drug_id"] == drug_id
    assert isinstance(forecast["predicted_demand"], float)
    assert forecast["predicted_demand"] >= 0
