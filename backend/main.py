from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routes import generate_sql, session, dataset
from app.models.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup stage
    await init_db()
    yield
    # shutdown stage

app = FastAPI(
    title="MainData.id API",
    description="Backend API for natural language to SQL translation",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate_sql.router, tags=["SQL Generation"])
app.include_router(session.router, tags=["Chat Sessions"])
app.include_router(dataset.router, tags=["Datasets"])

@app.get("/", tags=["Health Check"])
async def root():
    return {"status": "online", "message": "MainData.id API is running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
