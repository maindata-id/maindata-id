from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import httpx
import uuid
from typing import List, Optional

from app.models.db import get_db, DatasetCatalog
from app.models.schema import DatasetListResponse, DatasetListMetadata, DatasetReference

router = APIRouter()


@router.get("/dataset", response_model=DatasetListResponse)
async def list_datasets(
    limit: Optional[int] = Query(None, ge=1, le=100, description="Number of items to display per page. Defaults to 10 if not provided."),
    after: Optional[uuid.UUID] = Query(None, description="Cursor for pagination; the ID of the last item from the previous page."),
    search: Optional[str] = Query(None, description="Keyword to filter datasets by title or description."),
    db: AsyncSession = Depends(get_db)
):
    """
    List and search datasets from the catalog.
    Supports pagination using a cursor (`after`) and keyword search.
    Results are sorted by 'source_at' (descending) and then 'id' (descending).
    """
    effective_limit = limit if limit is not None else 10
    stmt = select(DatasetCatalog)

    # Apply search filter
    if search:
        search_term_like = f"%{search}%"
        # Assuming DatasetCatalog has 'title' and 'description' fields for searching.
        # These fields are present in the DatasetReference model.
        stmt = stmt.where(
            or_(
                DatasetCatalog.title.ilike(search_term_like),
                DatasetCatalog.description.ilike(search_term_like)
            )
        )

    # Apply cursor-based pagination
    if after:
        # Fetch the 'source_at' and 'id' of the item specified by the 'after' cursor
        cursor_stmt = select(DatasetCatalog.source_at, DatasetCatalog.id).where(DatasetCatalog.id == after)
        cursor_result = await db.execute(cursor_stmt)
        cursor_item = cursor_result.one_or_none()

        if not cursor_item:
            raise HTTPException(status_code=404, detail="Cursor dataset not found. Invalid 'after' parameter.")
        
        cursor_source_at, cursor_id_val = cursor_item
        # Filter for items "after" the cursor item, based on sorting order (source_at DESC, id DESC)
        stmt = stmt.where(
            (DatasetCatalog.source_at < cursor_source_at) |
            ((DatasetCatalog.source_at == cursor_source_at) & (DatasetCatalog.id < cursor_id_val))
        )

    # Apply sorting (newest first, with ID as tie-breaker for stable pagination)
    stmt = stmt.order_by(DatasetCatalog.source_at.desc(), DatasetCatalog.id.desc())

    # Apply limit
    stmt = stmt.limit(effective_limit)

    # Execute query
    result = await db.execute(stmt)
    datasets_db = result.scalars().all()

    # Prepare data for response
    response_data = [DatasetReference.from_orm(ds) for ds in datasets_db]

    # Determine the cursor for the next page
    next_page_cursor = None
    if len(response_data) == effective_limit:
        # If 'effective_limit' items were fetched, the last item's ID is the cursor for the next page
        next_page_cursor = response_data[-1].id

    return DatasetListResponse(
        message="success",
        metadata=DatasetListMetadata(limit=effective_limit, after=next_page_cursor, search=search),
        data=response_data
    )

@router.get("/dataset/{slug}")
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
