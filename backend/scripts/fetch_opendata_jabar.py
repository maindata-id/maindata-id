import asyncio
import os
import httpx
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import func, select
from dotenv import load_dotenv
import uuid
from typing import List, Dict, Any
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.db import DatasetCatalog
from app.utils.embedding import get_embedding

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
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# API Configuration
JABAR_API_BASE = "https://data.jabarprov.go.id/api-backend"
DATASETS_PER_PAGE = 100
HTTP_TIMEOUT = os.getenv("HTTP_TIMEOUT", 20)

async def get_dataset_count() -> int:
    """
    Get the count of existing datasets in the database
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count()).select_from(DatasetCatalog))
        count = result.scalar()
        return count or 0

async def fetch_datasets_page(client: httpx.AsyncClient, page: int = 0, base_skip: int = 0) -> Dict[str, Any]:
    """
    Fetch a page of datasets from the Jabar OpenData API
    """
    params = {
        "limit": DATASETS_PER_PAGE,
        "skip": base_skip + (page * DATASETS_PER_PAGE),
        "sort": "mdate:asc",
        "where": { "regional_id": 1 }, # filter only data from pemprov
    }
    
    response = await client.get(f"{JABAR_API_BASE}/dataset", params=params)
    response.raise_for_status()
    return response.json()

async def process_dataset(dataset: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a dataset entry and prepare it for storage
    """
    base_url = "https://data.jabarprov.go.id" 
    opendata_base_url = "https://opendata.jabarprov.go.id"
    # Get CSV download URL from bigdata_url if available
    csv_url = f"{base_url}{dataset['bigdata_url']}/?download=csv" if dataset.get('bigdata_url') else None
    
    # Get info URL
    info_url = f"{opendata_base_url}/id/dataset/{dataset['title']}"
    
    # Extract metadata
    metadata = {item['key']: item['value'] for item in dataset.get('metadata', [])}
    
    # Parse source date
    try:
        source_at = datetime.strptime(dataset['mdate'], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        source_at = datetime.now(timezone.utc)
    
    return {
        "title": dataset['name'],
        "description": dataset.get('description', '').replace('<p>', '').replace('</p>', '\n').strip(),
        "url": csv_url,
        "slug": "opendata-jabarprov-" + dataset['title'],
        "info_url": info_url,
        "direct_source": "opendata.jabarprov.go.id",
        "original_source": "opendata.jabarprov.go.id",
        "source_at": source_at
    }

async def update_catalog():
    """
    Update the dataset catalog with data from Jabar OpenData
    """
    current_dataset_count = await get_dataset_count()
    print(f"Current number of datasets in database: {current_dataset_count}")

    async with AsyncSessionLocal() as session:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            page = 0
            total_processed = 0
            
            while True:
                try:
                    print(f"\nFetching page {page + 1}...")
                    
                    # Get datasets page
                    result = await fetch_datasets_page(client, page, current_dataset_count)
                    datasets = result.get('data', [])
                    
                    if not datasets:
                        break
                    
                    for data in datasets:
                        try:
                            # Process dataset
                            processed_data = await process_dataset(data)
                            
                            # Skip if no CSV URL available
                            if not processed_data['url']:
                                continue
                            
                            # Generate embedding
                            combined_text = f"{processed_data['title']} {processed_data['description']}"
                            embedding = await get_embedding(combined_text)
                            
                            if embedding:
                                # Create dataset record
                                dataset = DatasetCatalog(
                                    id=uuid.uuid4(),
                                    title=processed_data['title'],
                                    description=processed_data['description'],
                                    url=processed_data['url'],
                                    info_url=processed_data['info_url'],
                                    source=processed_data['source'],
                                    source_at=processed_data['source_at'],
                                    embedding=embedding
                                )
                                
                                session.add(dataset)
                                total_processed += 1
                                print(f"Added dataset: {dataset.title}")
                            else:
                                print(f"Failed to generate embedding for: {processed_data['title']}")
                                
                        except Exception as e:
                            print(f"Error processing dataset: {str(e)}")
                            continue
                    
                    # Commit after each page
                    await session.commit()
                    
                    # Check if we've processed all pages
                    if len(datasets) < DATASETS_PER_PAGE:
                        break
                        
                    page += 1
                    
                except Exception as e:
                    print(f"Error fetching page {page + 1}: {str(e)}")
                    break
            
            print(f"\nCatalog update completed! Processed {total_processed} datasets.")

if __name__ == "__main__":
    asyncio.run(update_catalog())
