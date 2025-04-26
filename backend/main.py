from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import httpx

from app.routes import generate_sql, session
from app.models.db import init_db

app = FastAPI(
    title="MainData.id API",
    description="Backend API for natural language to SQL translation",
    version="1.0.0"
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

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/", tags=["Health Check"])
async def root():
    return {"status": "online", "message": "MainData.id API is running"}

@app.get("/proxy/csv")
async def proxy_csv(url: str):
    """
    # Create a streaming response

    testing:

        ```bash
        export EXAMPLE_CSV_URL=https://cdn.wsform.com/wp-content/uploads/2020/06/industry.csv
        curl "http://localhost:8000/proxy/csv?url=$EXAMPLE_CSV_URL" > downloaded.csv
        ```
    """
    async def stream_csv():
        try:
            # Set a timeout for the request (30 seconds)
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                # Use stream=True to avoid loading the entire file into memory
                async with client.stream("GET", url) as response:
                    if response.status_code != 200:
                        # If there's an error, we need to handle it differently
                        # since we're in a generator
                        yield f"Error: Failed to fetch CSV: {response.status_code}".encode()
                        return
                    
                    # Stream the response in chunks
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.ConnectTimeout:
            yield "Error: Connection timed out while trying to fetch the CSV file.".encode()
        except httpx.ReadTimeout:
            yield "Error: Read timed out while streaming the CSV file.".encode()
        except Exception as e:
            yield f"Error: Failed to fetch CSV: {str(e)}".encode()
    
    return StreamingResponse(
        stream_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment;filename=data.csv"}
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
