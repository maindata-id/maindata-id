import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.db import Base, get_db
from main import app
import os
from dotenv import load_dotenv

load_dotenv()

# Get test database URL
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
if not TEST_DATABASE_URL:
    raise ValueError("TEST_DATABASE_URL or DATABASE_URL environment variable not set")

# Convert to async URL if needed
if TEST_DATABASE_URL.startswith("postgresql://"):
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,  # Set to True for debugging
        pool_size=1,
        max_overflow=0,
        pool_pre_ping=True,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def test_db_session(test_engine):
    """Create a test database session."""
    TestSessionLocal = sessionmaker(
        bind=test_engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    async with TestSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def override_get_db(test_db_session):
    """Override the get_db dependency for testing."""
    async def _get_test_db():
        yield test_db_session
    
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()
