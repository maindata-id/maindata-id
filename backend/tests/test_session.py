import pytest
from pprint import pprint

@pytest.mark.asyncio
async def test_start_session(test_client):
    """Test the /start-session endpoint."""
    response = await test_client.post("/start-session")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "created_at" in data
    assert data.get("title") is None  # No title provided

    response_with_title = await test_client.post("/start-session", json={"title": "My Test Session"})
    assert response_with_title.status_code == 200
    data_with_title = response_with_title.json()
    assert "session_id" in data_with_title
    assert "created_at" in data_with_title
    assert data_with_title.get("title") == "My Test Session"

@pytest.mark.asyncio
async def test_get_session_not_found(test_client):
    """Test getting a session that does not exist."""
    fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
    response = await test_client.get(f"/session/{fake_session_id}")
    print('test_get_session_not_found:', response.json())
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}

@pytest.mark.asyncio
async def test_get_session_with_messages(test_client):
    """Test getting a session with existing messages."""
    # Start a session
    start_session_response = await test_client.post("/start-session")
    print('test_get_session_with_message:', start_session_response.json())
    assert start_session_response.status_code == 200
    session_id = start_session_response.json()["session_id"]

    # Add messages to the session
    message1_data = {"role": "user", "content": "Hello"}
    add_message_response1 = await test_client.post(f"/session/{session_id}", json=message1_data)
    assert add_message_response1.status_code == 200

    message2_data = {"role": "assistant", "content": "Hi there!"}
    add_message_response2 = await test_client.post(f"/session/{session_id}", json=message2_data)
    assert add_message_response2.status_code == 200

    # Get the session data
    get_session_response = await test_client.get(f"/session/{session_id}")
    assert get_session_response.status_code == 200
    session_data = get_session_response.json()

    assert session_data["id"] == session_id
    assert "created_at" in session_data
    assert "messages" in session_data
    assert len(session_data["messages"]) == 2

    # Check message content and order (order by created_at)
    messages = session_data["messages"]
    pprint(messages)
    assert messages[0]["content"] == "Hello"
    assert messages[0]["role"] == "user"

    assert messages[1]["content"] == "Hi there!"
    assert messages[1]["role"] == "assistant"

@pytest.mark.asyncio
async def test_add_message_to_session(test_client):
    """Test adding a message to an existing session."""
    # Start a session
    start_session_response = await test_client.post("/start-session")
    print('test_add_message_to_session:', start_session_response.json())
    assert start_session_response.status_code == 200
    session_id = start_session_response.json()["session_id"]

    # Add a message
    message_data = {"role": "user", "content": "This is a test message."}
    add_message_response = await test_client.post(f"/session/{session_id}", json=message_data)
    assert add_message_response.status_code == 200

    saved_message = add_message_response.json()
    assert "id" in saved_message
    assert saved_message["role"] == message_data["role"]
    assert saved_message["content"] == message_data["content"]
    assert "created_at" in saved_message

    # Verify the message is in the session history
    get_session_response = await test_client.get(f"/session/{session_id}")
    assert get_session_response.status_code == 200
    session_data = get_session_response.json()
    assert len(session_data["messages"]) == 1
    assert session_data["messages"][0]["content"] == message_data["content"]

@pytest.mark.asyncio
async def test_add_message_to_nonexistent_session(test_client):
    """Test adding a message to a session that does not exist."""
    fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
    message_data = {"role": "user", "content": "This message should fail."}
    response = await test_client.post(f"/session/{fake_session_id}", json=message_data)
    assert response.status_code == 404
    assert response.json() == {"detail": "Chat session not found"}

# Example of a test that needs direct database access
@pytest.mark.asyncio
async def test_database_direct_access(db_session):
    """Example test showing direct database access."""
    from app.models.db import ChatSession
    from sqlalchemy import select
    
    # Create a session directly in the database
    new_session = ChatSession(title="Direct DB Test")
    db_session.add(new_session)
    await db_session.commit()
    await db_session.refresh(new_session)
    
    # Query it back
    result = await db_session.execute(
        select(ChatSession).where(ChatSession.id == new_session.id)
    )
    retrieved_session = result.scalar_one()
    
    assert retrieved_session.title == "Direct DB Test"
    assert retrieved_session.id == new_session.id
