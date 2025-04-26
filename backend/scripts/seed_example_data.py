import asyncio
import os
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
import uuid

# Add parent directory to path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.db import DatasetCatalog, ReferenceQuery
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

# Example datasets
EXAMPLE_DATASETS = [
    {
        "title": "Penduduk Indonesia per Provinsi",
        "description": "Dataset populasi penduduk Indonesia per provinsi dari tahun 2010-2022",
        "url": "https://data.go.id/dataset/penduduk-indonesia"
    },
    {
        "title": "Anggaran Pendidikan Nasional",
        "description": "Alokasi anggaran pendidikan nasional per tahun dari APBN",
        "url": "https://data.go.id/dataset/anggaran-pendidikan"
    },
    {
        "title": "Indeks Pembangunan Manusia (IPM)",
        "description": "IPM per provinsi dari tahun 2010-2022 yang mengukur kesehatan, pendidikan, dan ekonomi",
        "url": "https://data.go.id/dataset/ipm-indonesia"
    },
    {
        "title": "Tingkat Kemiskinan per Provinsi",
        "description": "Persentase penduduk miskin per provinsi dari tahun 2015-2022",
        "url": "https://data.go.id/dataset/kemiskinan-provinsi"
    },
    {
        "title": "Pertumbuhan Ekonomi Regional",
        "description": "PDRB dan pertumbuhan ekonomi per provinsi dari tahun 2018-2022",
        "url": "https://data.go.id/dataset/pdrb-provinsi"
    }
]

# Example reference queries
EXAMPLE_QUERIES = [
    {
        "title": "Provinsi dengan Populasi Tertinggi",
        "description": "Mencari 5 provinsi dengan populasi tertinggi pada tahun 2022",
        "sql_query": """
SELECT 
    provinsi, 
    populasi
FROM 
    penduduk_provinsi
WHERE 
    tahun = 2022
ORDER BY 
    populasi DESC
LIMIT 5;
"""
    },
    {
        "title": "Tren Anggaran Pendidikan",
        "description": "Menampilkan tren anggaran pendidikan dari tahun 2018-2022",
        "sql_query": """
SELECT 
    tahun, 
    anggaran_pendidikan,
    anggaran_pendidikan / anggaran_total * 100 AS persentase
FROM 
    anggaran_nasional
WHERE 
    tahun BETWEEN 2018 AND 2022
ORDER BY 
    tahun;
"""
    },
    {
        "title": "Provinsi dengan IPM Tertinggi dan Terendah",
        "description": "Mencari provinsi dengan IPM tertinggi dan terendah pada tahun 2022",
        "sql_query": """
(SELECT 
    provinsi, 
    nilai_ipm,
    'Tertinggi' AS kategori
FROM 
    ipm_provinsi
WHERE 
    tahun = 2022
ORDER BY 
    nilai_ipm DESC
LIMIT 1)

UNION ALL

(SELECT 
    provinsi, 
    nilai_ipm,
    'Terendah' AS kategori
FROM 
    ipm_provinsi
WHERE 
    tahun = 2022
ORDER BY 
    nilai_ipm ASC
LIMIT 1);
"""
    },
    {
        "title": "Perubahan Tingkat Kemiskinan",
        "description": "Membandingkan perubahan tingkat kemiskinan dari 2020 ke 2022 per provinsi",
        "sql_query": """
SELECT 
    a.provinsi,
    a.persentase_kemiskinan AS kemiskinan_2020,
    b.persentase_kemiskinan AS kemiskinan_2022,
    b.persentase_kemiskinan - a.persentase_kemiskinan AS perubahan
FROM 
    kemiskinan_provinsi a
JOIN 
    kemiskinan_provinsi b ON a.provinsi = b.provinsi
WHERE 
    a.tahun = 2020
    AND b.tahun = 2022
ORDER BY 
    perubahan;
"""
    }
]

async def seed_data():
    """Seed the database with example data"""
    async with AsyncSessionLocal() as session:
        # Add datasets
        print("Adding example datasets...")
        for dataset_data in EXAMPLE_DATASETS:
            # Get embedding for dataset
            combined_text = f"{dataset_data['title']} {dataset_data['description']}"
            embedding = await get_embedding(combined_text)
            
            # Create dataset record
            dataset = DatasetCatalog(
                id=uuid.uuid4(),
                title=dataset_data["title"],
                description=dataset_data["description"],
                url=dataset_data["url"],
                embedding=embedding
            )
            session.add(dataset)
            print(f"Added dataset: {dataset.title}")
        
        # Add reference queries
        print("\nAdding example reference queries...")
        for query_data in EXAMPLE_QUERIES:
            # Get embedding for query
            combined_text = f"{query_data['title']} {query_data['description']} {query_data['sql_query']}"
            embedding = await get_embedding(combined_text)
            
            # Create reference query record
            ref_query = ReferenceQuery(
                id=uuid.uuid4(),
                title=query_data["title"],
                description=query_data["description"],
                sql_query=query_data["sql_query"],
                embedding=embedding
            )
            session.add(ref_query)
            print(f"Added reference query: {ref_query.title}")
        
        # Commit changes
        await session.commit()
        print("\nSeed data successfully added to the database!")

if __name__ == "__main__":
    asyncio.run(seed_data())