import httpx
import pytest
import pytest_asyncio
from main import app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.db import get_db, Base
from pprint import pprint
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL
TEST_DATABASE_URL = os.getenv("DATABASE_URL")
if TEST_DATABASE_URL.startswith("postgresql://"):
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

@pytest_asyncio.fixture(scope="function")
async def test_db():
    """Create a test database session for each test."""
    # Create engine for this specific test
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_size=1,
        max_overflow=0,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session factory
    TestSessionLocal = sessionmaker(
        bind=engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    # Override the dependency
    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield
    
    # Cleanup
    app.dependency_overrides.clear()
    
    # Drop tables and dispose engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.mark.asyncio
async def test_start_session(test_db):
    """Test the /start-session endpoint."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/start-session")
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "created_at" in data
        assert data.get("title") is None # No title provided

        response_with_title = await ac.post("/start-session", json={"title": "My Test Session"})
        assert response_with_title.status_code == 200
        data_with_title = response_with_title.json()
        assert "session_id" in data_with_title
        assert "created_at" in data_with_title
        assert data_with_title.get("title") == "My Test Session"

@pytest.mark.asyncio
async def test_get_session_not_found(test_db):
    """Test getting a session that does not exist."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
        response = await ac.get(f"/session/{fake_session_id}")
        print('test_get_session_not_found:', response.json())
        assert response.status_code == 404
        assert response.json() == {"detail": "Session not found"}

@pytest.mark.asyncio
async def test_get_session_with_messages(test_db):
    """Test getting a session with existing messages."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        # Start a session
        start_session_response = await ac.post("/start-session")
        print('test_get_session_with_message:', start_session_response.json())
        assert start_session_response.status_code == 200
        session_id = start_session_response.json()["session_id"]

        # Add messages to the session
        message1_data = {"role": "user", "content": "Hello"}
        add_message_response1 = await ac.post(f"/session/{session_id}", json=message1_data)
        assert add_message_response1.status_code == 200

        message2_data = {"role": "assistant", "content": "Hi there!"}
        add_message_response2 = await ac.post(f"/session/{session_id}", json=message2_data)
        assert add_message_response2.status_code == 200

        # Get the session data
        get_session_response = await ac.get(f"/session/{session_id}")
        assert get_session_response.status_code == 200
        session_data = get_session_response.json()

        assert session_data["id"] == session_id
        assert "created_at" in session_data
        assert "messages" in session_data
        assert len(session_data["messages"]) == 2

        # Check message content and order (order by created_at)
        messages = session_data["messages"]
        pprint( messages )
        assert messages[0]["content"] == "Hello"
        assert messages[0]["role"] == "user"

        assert messages[1]["content"] == "Hi there!"
        assert messages[1]["role"] == "assistant"

@pytest.mark.asyncio
async def test_add_message_to_session(test_db):
    """Test adding a message to an existing session."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        # Start a session
        start_session_response = await ac.post("/start-session")
        print('test_add_message_to_session:', start_session_response.json())
        assert start_session_response.status_code == 200
        session_id = start_session_response.json()["session_id"]

        # Add a message
        message_data = {"role": "user", "content": "This is a test message."}
        add_message_response = await ac.post(f"/session/{session_id}", json=message_data)
        assert add_message_response.status_code == 200

        saved_message = add_message_response.json()
        assert "id" in saved_message
        assert saved_message["role"] == message_data["role"]
        assert saved_message["content"] == message_data["content"]
        assert "created_at" in saved_message

        # Verify the message is in the session history
        get_session_response = await ac.get(f"/session/{session_id}")
        assert get_session_response.status_code == 200
        session_data = get_session_response.json()
        assert len(session_data["messages"]) == 1
        assert session_data["messages"][0]["content"] == message_data["content"]

@pytest.mark.asyncio
async def test_add_message_to_nonexistent_session(test_db):
    """Test adding a message to a session that does not exist."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        fake_session_id = "123e4567-e89b-12d3-a456-426614174000"
        message_data = {"role": "user", "content": "This message should fail."}
        response = await ac.post(f"/session/{fake_session_id}", json=message_data)
        assert response.status_code == 404
        assert response.json() == {"detail": "Chat session not found"}
