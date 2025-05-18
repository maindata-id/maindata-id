from fastapi.testclient import TestClient
from main import app
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import get_db, ChatSession, ChatMessage, engine, Base
import pytest
import asyncio

# Use the standard TestClient which will use the app's configured database dependency
client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
async def cleanup_db():
    """Clean up database tables after each test."""
    async with AsyncSession(engine) as session:
        async with session.begin():
            # Delete data from tables in reverse order of dependency
            await session.execute(ChatMessage.__table__.delete())
            await session.execute(ChatSession.__table__.delete())
        await session.commit()


@pytest.mark.asyncio
async def test_start_session():
    """Test the /start-session endpoint."""
    # response = client.post("/start-session")
    # assert response.status_code == 200
    # data = response.json()
    # assert "session_id" in data
    # assert "created_at" in data
    # assert data.get("title") is None # No title provided

    response_with_title = client.post("/start-session", json={"title": "My Test Session"})
    assert response_with_title.status_code == 200
    data_with_title = response_with_title.json()
    assert "session_id" in data_with_title
    assert "created_at" in data_with_title
    assert data_with_title.get("title") == "My Test Session"

@pytest.mark.asyncio
async def test_get_session_not_found():
    """Test getting a session that does not exist."""
    fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
    response = client.get(f"/session/{fake_session_id}")
    print('wowow:', response.json())
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}

@pytest.mark.asyncio
async def test_get_session_with_messages():
    """Test getting a session with existing messages."""
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
async def test_add_message_to_session():
    """Test adding a message to an existing session."""
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
async def test_add_message_to_nonexistent_session():
    """Test adding a message to a session that does not exist."""
    fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
    message_data = {"role": "user", "content": "This message should fail."}
    response = client.post(f"/session/{fake_session_id}", json=message_data)
    assert response.status_code == 404
    assert response.json() == {"detail": "Chat session not found"}
