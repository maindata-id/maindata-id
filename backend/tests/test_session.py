from fastapi.testclient import TestClient
from main import app
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import get_db, Base, engine
import pytest
import asyncio

# Use the TestClient for making requests
# client = TestClient(app) # This is not needed when using the fixture

# Override the get_db dependency to use an in-memory SQLite database for testing
# This requires sqlalchemy[asyncio] and pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Force the creation of a new event loop for the session."""
    return asyncio.get_event_loop()

@pytest.fixture(scope="function")
async def db_session():
    """Create a new database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session
        await session.rollback() # Rollback changes after each test
        await session.close()

@pytest.fixture(scope="function")
def client_with_db(db_session):
    """Provide a test client with the overridden database dependency."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_start_session(client_with_db):
    """Test the /start-session endpoint."""
    with client_with_db as client:
        response = client.post("/start-session")
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "created_at" in data
        assert data.get("title") is None # No title provided

        response_with_title = client.post("/start-session", json={"title": "My Test Session"})
        assert response_with_title.status_code == 200
        data_with_title = response_with_title.json()
        assert "session_id" in data_with_title
        assert "created_at" in data_with_title
        assert data_with_title.get("title") == "My Test Session"

@pytest.mark.asyncio
async def test_get_session_not_found(client_with_db):
    """Test getting a session that does not exist."""
    with client_with_db as client:
        fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.get(f"/session/{fake_session_id}")
        assert response.status_code == 404
        assert response.json() == {"detail": "Session not found"}

@pytest.mark.asyncio
async def test_get_session_with_messages(client_with_db):
    """Test getting a session with existing messages."""
    with client_with_db as client:
        # Start a session
        start_session_response = client.post("/start-session")
        assert start_session_response.status_code == 200
        session_id = start_session_response.json()["session_id"]

        # Add messages to the session
        message1_data = {"role": "user", "content": "Hello"}
        add_message_response1 = client.post(f"/session/{session_id}", json=message1_data)
        assert add_message_response1.status_code == 200

        message2_data = {"role": "assistant", "content": "Hi there!"}
        add_message_response2 = client.post(f"/session/{session_id}", json=message2_data)
        assert add_message_response2.status_code == 200

        # Get the session data
        get_session_response = client.get(f"/session/{session_id}")
        assert get_session_response.status_code == 200
        session_data = get_session_response.json()

        assert session_data["id"] == session_id
        assert "created_at" in session_data
        assert "messages" in session_data
        assert len(session_data["messages"]) == 2

        # Check message content and order (order by created_at)
        messages = session_data["messages"]
        assert messages[0]["content"] == "Hello"
        assert messages[0]["role"] == "user"
        assert messages[0]["session_id"] == session_id

        assert messages[1]["content"] == "Hi there!"
        assert messages[1]["role"] == "assistant"
        assert messages[1]["session_id"] == session_id

@pytest.mark.asyncio
async def test_add_message_to_session(client_with_db):
    """Test adding a message to an existing session."""
    with client_with_db as client:
        # Start a session
        start_session_response = client.post("/start-session")
        assert start_session_response.status_code == 200
        session_id = start_session_response.json()["session_id"]

        # Add a message
        message_data = {"role": "user", "content": "This is a test message."}
        add_message_response = client.post(f"/session/{session_id}", json=message_data)
        assert add_message_response.status_code == 200

        saved_message = add_message_response.json()
        assert "id" in saved_message
        assert saved_message["session_id"] == session_id
        assert saved_message["role"] == message_data["role"]
        assert saved_message["content"] == message_data["content"]
        assert "created_at" in saved_message

        # Verify the message is in the session history
        get_session_response = client.get(f"/session/{session_id}")
        assert get_session_response.status_code == 200
        session_data = get_session_response.json()
        assert len(session_data["messages"]) == 1
        assert session_data["messages"][0]["content"] == message_data["content"]

@pytest.mark.asyncio
async def test_add_message_to_nonexistent_session(client_with_db):
    """Test adding a message to a session that does not exist."""
    with client_with_db as client:
        fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
        message_data = {"role": "user", "content": "This message should fail."}
        response = client.post(f"/session/{fake_session_id}", json=message_data)
        assert response.status_code == 404
        assert response.json() == {"detail": "Chat session not found"}
