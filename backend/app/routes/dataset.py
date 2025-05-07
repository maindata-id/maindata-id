from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.models.db import get_db, DatasetCatalog

router = APIRouter()

@router.get("/dataset/{slug}/data")
async def get_dataset_data(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get dataset data by slug. If CORS is allowed, redirect to URL.
    Otherwise, proxy the content stream.
    """
    # Get dataset info
    result = await db.execute(
        select(DatasetCatalog).where(DatasetCatalog.slug == slug)
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # If CORS is allowed, redirect to the URL
    if dataset.is_cors_allowed:
        return RedirectResponse(url=dataset.url)
    
    # Otherwise, proxy the content
    async def stream_content():
        async with httpx.AsyncClient() as client:
            async with client.stream('GET', dataset.url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
    
    return StreamingResponse(
        stream_content(),
        media_type='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{dataset.slug}.csv"'
        }
    )
