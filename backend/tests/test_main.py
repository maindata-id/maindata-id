# tests/test_main.py
# import sys
# sys.path.append('..')
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "message": "MainData.id API is running"}

# def test_create_item():
#   response = client.post("/items/", json={"name": "Item 1"})
#   assert response.status_code == 201
#   assert response.json()["name"] == "Item 1"
