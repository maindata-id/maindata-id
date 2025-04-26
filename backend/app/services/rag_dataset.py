from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import DatasetCatalog
from app.utils.embedding import get_embedding
from app.models.schema import DatasetReference
from typing import List
import numpy as np

async def get_relevant_datasets(
    db: AsyncSession, 
    question: str, 
    limit: int = 3
) -> List[DatasetReference]:
    """
    Get relevant datasets using vector similarity search
    """
    # Get embedding for question
    question_embedding = await get_embedding(question)
    
    if not question_embedding:
        return []
    
    # Convert to numpy array for calculation
    embedding_array = np.array(question_embedding)
    
    # Query most similar datasets
    query = select(DatasetCatalog).order_by(
        # Using cosine similarity with pgvector
        DatasetCatalog.embedding.cosine_distance(embedding_array)
    ).limit(limit)
    
    result = await db.execute(query)
    datasets = result.scalars().all()
    
    # Convert to response model
    return [
        DatasetReference(
            id=dataset.id,
            title=dataset.title,
            description=dataset.description,
            url=dataset.url
        )
        for dataset in datasets
    ]