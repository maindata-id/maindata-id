import asyncio
import os
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
import uuid

# Add parent directory to path
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

# Mock data sources (in real implementation, these would be API calls)
MOCK_DATA_SOURCES = {
    "data.go.id": [
        {
            "title": "Statistik Pendidikan Indonesia 2023",
            "description": "Data statistik pendidikan formal dan non-formal di Indonesia tahun 2023",
            "url": "https://data.go.id/dataset/pendidikan-2023.csv",
            "info_url": "https://data.go.id/dataset/statistik-pendidikan-2023",
            "source_at": datetime(2023, 12, 1, tzinfo=timezone.utc)
        },
        {
            "title": "Anggaran Kesehatan Daerah 2023",
            "description": "Alokasi dan realisasi anggaran kesehatan per provinsi tahun 2023",
            "url": "https://data.go.id/dataset/kesehatan-2023.csv",
            "info_url": "https://data.go.id/dataset/anggaran-kesehatan-2023",
            "source_at": datetime(2023, 11, 15, tzinfo=timezone.utc)
        }
    ],
    "bps.go.id": [
        {
            "title": "Indeks Pembangunan Manusia 2023",
            "description": "IPM dan komponennya untuk seluruh provinsi di Indonesia",
            "url": "https://bps.go.id/dataset/ipm-2023.csv",
            "info_url": "https://bps.go.id/subject/26/indeks-pembangunan-manusia.html",
            "source_at": datetime(2024, 1, 15, tzinfo=timezone.utc)
        }
    ]
}

async def fetch_from_source(source_name: str) -> list:
    """
    Mock function to fetch datasets from a source
    In real implementation, this would make API calls
    """
    return MOCK_DATA_SOURCES.get(source_name, [])

async def update_catalog():
    """Update the dataset catalog with latest data from sources"""
    async with AsyncSessionLocal() as session:
        for source_name, _ in MOCK_DATA_SOURCES.items():
            print(f"\nFetching from {source_name}...")
            
            # Get datasets from source
            datasets = await fetch_from_source(source_name)
            
            for data in datasets:
                # Generate embedding for the dataset
                combined_text = f"{data['title']} {data['description']}"
                embedding = await get_embedding(combined_text)
                
                if embedding:
                    # Create dataset record
                    dataset = DatasetCatalog(
                        id=uuid.uuid4(),
                        title=data["title"],
                        description=data["description"],
                        url=data["url"],
                        info_url=data["info_url"],
                        source=source_name,
                        source_at=data["source_at"],
                        embedding=embedding
                    )
                    
                    session.add(dataset)
                    print(f"Added dataset: {dataset.title}")
                else:
                    print(f"Failed to generate embedding for: {data['title']}")
            
            # Commit changes for this source
            await session.commit()
            
        print("\nCatalog update completed!")

if __name__ == "__main__":
    asyncio.run(update_catalog())