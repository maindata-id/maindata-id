import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.db import get_db, Base
from main import app  # Import your FastAPI app
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    """
    Automatically set up a test database for each test function.
    This fixture runs automatically for every test (autouse=True).
    """
    # Get database URL
    test_database_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not test_database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Convert to async URL if needed
    if test_database_url.startswith("postgresql://"):
        test_database_url = test_database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Create engine for this specific test
    engine = create_async_engine(
        test_database_url,
        echo=False,  # Set to True for SQL debugging
        pool_size=1,
        max_overflow=0,
        pool_pre_ping=True,
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
    
    # Apply the override
    app.dependency_overrides[get_db] = override_get_db
    
    # Yield control to the test
    yield
    
    # Cleanup after the test
    app.dependency_overrides.clear()
    
    # Drop tables and dispose engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

# Optional: Create a fixture for when you need direct database access in tests
@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Provide direct database session access for tests that need it.
    Usage: async def test_something(db_session): ...
    """
    # Get the current override (set by setup_test_db)
    override_func = app.dependency_overrides.get(get_db)
    if override_func:
        async for session in override_func():
            yield session
    else:
        raise RuntimeError("Test database not set up. Make sure setup_test_db fixture is running.")

# Optional: Fixture for HTTP client (if you use it frequently)
@pytest_asyncio.fixture(scope="function")
async def test_client():
    """
    Provide an async HTTP client for testing FastAPI endpoints.
    Usage: async def test_something(test_client): ...
    """
    import httpx
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        yield client
