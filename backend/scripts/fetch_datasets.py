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
    "opendata.bandung.go.id": [
        {
            "title": "Jumlah Capaian Penanganan Sampah di Kota Bandung",
            "description": """
                Dataset ini berisi data jumlah capaian penanganan sampah di Kota Bandung dari tahun 2017 s.d. 2024.

                Dataset terkait topik Lingkungan Hidup ini dihasilkan oleh Dinas Lingkungan Hidup yang dikeluarkan dalam periode 1 tahun sekali.

                Penjelasan mengenai variabel di dalam dataset ini:

                    kode_provinsi: menyatakan kode Provinsi Jawa Barat sesuai ketentuan BPS merujuk pada aturan Peraturan Badan Pusat Statistik Nomor 3 Tahun 2019 dengan tipe data numerik.
                    nama_provinsi: menyatakan lingkup data berasal dari wilayah Provinsi Jawa Barat sesuai ketentuan BPS merujuk pada aturan Peraturan Badan Pusat Statistik Nomor 3 Tahun 2019 dengan tipe data teks.
                    kode_kabupaten_kota: menyatakan kode dari tiap-tiap kabupaten dan kota di Provinsi Jawa Barat sesuai ketentuan BPS merujuk pada aturan Peraturan Badan Pusat Statistik Nomor 3 Tahun 2019 dengan tipe data numerik.
                    nama_kabupaten_kota: menyatakan lingkup data berasal dari tiap-tiap kabupaten dan kota di Provinsi Jawa Barat sesuai penamaan BPS  merujuk pada aturan Peraturan Badan Pusat Statistik Nomor 3 Tahun 2019 dengan tipe data teks.
                    bulan: menyatakan bulan pengangkutan sampah dengan tipe data teks.
                    jumlah_sampah: menyatakan jumlah sampah dengan tipe data numerik.
                    satuan: menyatakan satuan dari pengukuran jumlah sampah dalam ton dengan tipe data teks.
                    tahun: menyatakan tahun produksi data dengan tipe data numerik.
            """,
            "url": "https://opendata.bandung.go.id/api/bigdata/dinas_lingkungan_hidup/jumlah_capaian_penanganan_sampah_di_kota_bandung?download=csv",
            "info_url": "https://opendata.bandung.go.id/dataset/jumlah-capaian-penanganan-sampah-di-kota-bandung",
            "source_at": datetime(2025, 3, 6, tzinfo=timezone.utc)
        },
    ],
    "bps.go.id": [
        {
            "title": "Indeks Pembangunan Manusia menurut Provinsi, 2022-2024",
            "description": "IPM dan komponennya untuk seluruh provinsi di Indonesia",
            "url": "https://www.bps.go.id/9953c3a2-bea4-4f79-8994-31bb30ed65c5",
            "info_url": "https://www.bps.go.id/id/statistics-table/2/NDk0IzI=/-metode-baru--indeks-pembangunan-manusia-menurut-provinsi.html",
            "source_at": datetime(2024, 11, 15, tzinfo=timezone.utc)
        }
    ],
    "satudata.badanpangan.go.id": [
        {
            "title": "Rata-rata Konsumsi per Jenis Pangan Penduduk Indonesia Provinsi",
            "description": """
                Metode perhitungan
                    1. Mengelompokkan pangan menjadi 9 kelompok pangan ( Padi-padian, umbi-umbian, pangan hewani, minyak dan lemak, buah/ biji berminyak, kacang-kacangan, gula, sayur dan buah, aneka bumbu dan bahan minuman). 2. Mengkonversi ke dalam bentuk, jenis, dan satuan yang sama. 3. Selanjutnya besaran energi setiap jenis pangan dijumlahkan menurut kelompok pangannya. 4. Menjumlahkan total konsumsi pangan dari masing-masing kelompok pangan sehingga akan diketahui total konsumsi pangan dari seluruh kelompok pangan.
                Interpretasi
                    Semakin besar nilai rata-rata konsumsi pangan, semakin banyak konsumsi komoditas tersebut. 
                Satuan Data
                    kg/kap/tahun
            """,
            "url": "https://satudata.badanpangan.go.id/download/document/dataset/44/1728615152.csv/csv",
            "info_url": "https://satudata.badanpangan.go.id/datasetpublications/817/konsumsi-provinsi",
            "source_at": datetime(2024, 10, 30, tzinfo=timezone.utc)
        }
    ],
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
