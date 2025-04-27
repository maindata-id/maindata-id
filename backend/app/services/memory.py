from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import ChatSession, ChatMessage
from app.models.schema import MessageModel
from typing import List, Optional
from uuid import UUID

async def create_session(db: AsyncSession, title: Optional[str] = None) -> ChatSession:
    """
    Create a new chat session
    """
    session = ChatSession(title=title)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session(db: AsyncSession, session_id: UUID) -> Optional[ChatSession]:
    """
    Get a chat session by ID
    """
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    return result.scalar_one_or_none()

async def save_message(
    db: AsyncSession, 
    session_id: UUID, 
    role: str, 
    content: str
) -> ChatMessage:
    """
    Save a message to the chat history
    """
    # First verify the session exists
    session = await get_session(db, session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
        
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message

async def get_session_history(
    db: AsyncSession, 
    session_id: UUID
) -> List[MessageModel]:
    """
    Get all messages for a session ordered by creation time
    """
    # First verify the session exists
    session = await get_session(db, session_id)
    if not session:
        return []
        
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    
    return [
        MessageModel(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at
        )
        for msg in messages
    ]
