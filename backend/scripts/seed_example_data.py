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

from app.models.db import DatasetCatalog, ReferenceQuery
from app.utils.embedding import get_embedding

# Load environment variables
load_dotenv()

BASE_URL="http://localhost:8000"

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
        "source_at": datetime(2025, 3, 6, tzinfo=timezone.utc),
        "source": "opendata.bandung.go.id",
    },
    {
        "title": "Indeks Pembangunan Manusia menurut Provinsi, 2022-2024",
        "description": "IPM dan komponennya untuk seluruh provinsi di Indonesia",
        "url": "https://www.bps.go.id/9953c3a2-bea4-4f79-8994-31bb30ed65c5",
        "info_url": "https://www.bps.go.id/id/statistics-table/2/NDk0IzI=/-metode-baru--indeks-pembangunan-manusia-menurut-provinsi.html",
        "source_at": datetime(2024, 11, 15, tzinfo=timezone.utc),
        "source": "bps.go.id",
    },
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
        "source_at": datetime(2024, 10, 30, tzinfo=timezone.utc),
        "source": "satudata.badanpangan.go.id",
    },
]

# Example reference queries
EXAMPLE_QUERIES = [
    {
        "title": "load data 'Rata-rata Konsumsi per Jenis Pangan Penduduk Indonesia Provinsi' ke user",
        "description": "load data 'Rata-rata Konsumsi per Jenis Pangan Penduduk Indonesia Provinsi' ke user",
        "sql_query": f"""
create table rata_rata_konsumesi_per_jenis_pangan as 
   select * from read_csv('{BASE_URL}/proxy/csv?url=https://satudata.badanpangan.go.id/download/document/dataset/44/1728615152.csv/csv');
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
            
            if embedding:
                # Create dataset record
                dataset = DatasetCatalog(
                    id=uuid.uuid4(),
                    title=dataset_data["title"],
                    description=dataset_data["description"],
                    url=dataset_data["url"],
                    info_url=dataset_data["info_url"],
                    source=dataset_data["source"],
                    source_at=dataset_data["source_at"],
                    embedding=embedding
                )
                session.add(dataset)
                print(f"Added dataset: {dataset.title}")
            else:
                print(f"Failed to generate embedding for: {dataset_data['title']}")
        
        # Add reference queries
        print("\nAdding example reference queries...")
        for query_data in EXAMPLE_QUERIES:
            # Get embedding for query
            combined_text = f"{query_data['title']} {query_data['description']} {query_data['sql_query']}"
            embedding = await get_embedding(combined_text)
            
            if embedding:
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
            else:
                print(f"Failed to generate embedding for query: {query_data['title']}")
        
        # Commit changes
        await session.commit()
        print("\nSeed data successfully added to the database!")

if __name__ == "__main__":
    asyncio.run(seed_data())
