from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import get_db
from app.models.schema import GenerateSQLRequest, GenerateSQLResponse, ErrorResponse
from app.services.rag_dataset import get_relevant_datasets
from app.services.rag_sql import get_relevant_queries
from app.services.llm import generate_sql_from_nl, generate_sql_stream
from app.services.memory import save_message, get_session_history, get_session
from uuid import UUID

router = APIRouter()

@router.post(
    "/generate-sql",
    response_model=GenerateSQLResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def generate_sql(
    request: GenerateSQLRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate SQL from natural language question, using RAG and chat history.
    """
    try:
        # First verify session exists
        session = await get_session(db, request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        # Get chat history for context
        chat_history = await get_session_history(db, request.session_id)
            
        # Get relevant datasets and example queries using RAG
        relevant_datasets = await get_relevant_datasets(db, request.question)
        relevant_queries = await get_relevant_queries(db, request.question)
        
        if not relevant_datasets:
            raise HTTPException(
                status_code=400, 
                detail="No relevant datasets found for your question"
            )
        
        # Save user message to chat history
        await save_message(
            db, 
            session_id=request.session_id, 
            role="user", 
            content=request.question
        )
        
        # Generate SQL using LLM with context
        sql_result = await generate_sql_from_nl(
            question=request.question,
            chat_history=chat_history,
            datasets=relevant_datasets,
            reference_queries=relevant_queries
        )
        
        # Save assistant response to chat history
        assistant_msg = await save_message(
            db, 
            session_id=request.session_id, 
            role="assistant", 
            content=sql_result["sql"]
        )
        
        # Get updated chat history
        updated_chat_history = await get_session_history(db, request.session_id)
        
        return GenerateSQLResponse(
            sql=sql_result["sql"],
            datasets_used=relevant_datasets,
            reference_queries_used=relevant_queries,
            explanation=sql_result["explanation"],
            messages=updated_chat_history
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate SQL: {str(e)}")

@router.post("/generate-sql-stream")
async def generate_sql_stream_endpoint(
    request: GenerateSQLRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Stream SQL generation results using server-sent events
    """
    async def event_generator():
        try:
            # Verify session exists
            session = await get_session(db, request.session_id)
            if not session:
                yield "data: " + '{"error": "Chat session not found"}\n\n'
                return
                
            # Get chat history for context
            chat_history = await get_session_history(db, request.session_id)
                
            # Get relevant datasets and example queries using RAG
            relevant_datasets = await get_relevant_datasets(db, request.question)
            relevant_queries = await get_relevant_queries(db, request.question)
            
            if not relevant_datasets:
                yield "data: " + '{"error": "No relevant datasets found for your question"}\n\n'
                return
            
            # Save user message to chat history
            await save_message(
                db, 
                session_id=request.session_id, 
                role="user", 
                content=request.question
            )
            
            # Stream SQL generation
            full_response = ""
            async for chunk in generate_sql_stream(
                question=request.question,
                chat_history=chat_history,
                datasets=relevant_datasets,
                reference_queries=relevant_queries
            ):
                full_response += chunk
                yield f"data: {chunk}\n\n"
            
            # Save complete response to chat history
            await save_message(
                db, 
                session_id=request.session_id, 
                role="assistant", 
                content=full_response
            )
            
            # Signal end of stream
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: " + '{"error": "' + str(e) + '"}\n\n'
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )
