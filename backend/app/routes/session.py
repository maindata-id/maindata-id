from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.db import get_db
from app.models.schema import (
    StartSessionRequest, 
    StartSessionResponse, 
    SessionModel,
    MessageModel,
    ErrorResponse
)
from app.services.memory import (
    create_session,
    get_session,
    get_session_history
)
import uuid

router = APIRouter()

@router.post(
    "/start-session",
    response_model=StartSessionResponse,
    responses={500: {"model": ErrorResponse}}
)
async def start_session(
    request: StartSessionRequest = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new chat session and return its ID.
    """
    try:
        title = request.title if request and request.title else None
        session = await create_session(db, title)
        
        return StartSessionResponse(
            session_id=session.id,
            created_at=session.created_at,
            title=session.title
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@router.get(
    "/session/{session_id}",
    response_model=SessionModel,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_session_data(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get full session data including chat history.
    """
    try:
        session = await get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        messages = await get_session_history(db, session_id)
        
        return SessionModel(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            messages=messages
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")