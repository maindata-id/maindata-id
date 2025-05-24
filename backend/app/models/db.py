from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, relationship,  declarative_base
import os
from dotenv import load_dotenv
import uuid
from pgvector.sqlalchemy import Vector

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Convert to async URL if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create async engine
engine = create_async_engine(DATABASE_URL,
    echo=True,
    pool_size=20,          # Increase pool size
    max_overflow=30,       # Allow overflow connections
    pool_pre_ping=True,    # Validate connections
    pool_recycle=3600,     # Recycle connections hourly
    connect_args={
        "server_settings": {
            "application_name": "your_app_name"
        }
    }
)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Database models
class DatasetCatalog(Base):
    __tablename__ = "dataset_catalog"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    url = Column(String, nullable=False)
    info_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    direct_source = Column(String, nullable=False)
    original_source = Column(String, nullable=False)
    source_at = Column(DateTime(timezone=True), nullable=False)
    embedding = Column(Vector(768))  # Gemini embedding dimension
    is_cors_allowed = Column(Boolean, nullable=False, default=False)
    slug = Column(String, nullable=False, unique=True)

class ReferenceQuery(Base):
    __tablename__ = "reference_queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=False)
    embedding = Column(Vector(768))  # Gemini embedding dimension
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to messages
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to session
    session = relationship("ChatSession", back_populates="messages")

# Database initialization
async def init_db():
    async with engine.begin() as conn:
        # Uncomment to create tables if they don't exist
        # await conn.run_sync(Base.metadata.create_all)
        pass

# Dependency for database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
