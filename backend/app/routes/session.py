from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.db import get_db
from app.models.schema import (
    StartSessionRequest,
    StartSessionResponse,
    SessionModel,
    MessageModel,
    ErrorResponse,
    SaveMessageRequest # Import the new schema
)
from app.services.memory import (
    create_session,
    get_session,
    get_session_history,
    save_message # Import save_message
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

@router.post(
    "/session/{session_id}",
    response_model=MessageModel, # Assuming you want to return the saved message
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def add_message_to_session(
    session_id: uuid.UUID,
    request: SaveMessageRequest, # Use the new schema for the request body
    db: AsyncSession = Depends(get_db)
):
    """
    Add a new message to an existing chat session.
    """
    try:
        # First verify session exists
        session = await get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        # Save the message
        saved_message = await save_message(
            db,
            session_id=session_id,
            role=request.role,
            content=request.content
        )

        # Return the saved message
        return MessageModel(
            id=saved_message.id,
            session_id=saved_message.session_id,
            role=saved_message.role,
            content=saved_message.content,
            created_at=saved_message.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add message to session: {str(e)}")
