from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import ReferenceQuery
from app.utils.embedding import get_embedding
from app.models.schema import QueryReference
from typing import List
import numpy as np

async def get_relevant_queries(
    db: AsyncSession, 
    question: str, 
    limit: int = 2
) -> List[QueryReference]:
    """
    Get relevant SQL reference queries using vector similarity search
    """
    # Get embedding for question
    question_embedding = await get_embedding(question)
    
    if not question_embedding:
        return []
    
    # Convert to numpy array for calculation
    embedding_array = np.array(question_embedding)
    
    # Query most similar reference queries
    query = select(ReferenceQuery).order_by(
        # Using cosine similarity with pgvector
        ReferenceQuery.embedding.cosine_distance(embedding_array)
    ).limit(limit)
    
    result = await db.execute(query)
    reference_queries = result.scalars().all()
    
    # Convert to response model
    return [
        QueryReference(
            id=query.id,
            title=query.title,
            description=query.description,
            sql_query=query.sql_query
        )
        for query in reference_queries
    ]