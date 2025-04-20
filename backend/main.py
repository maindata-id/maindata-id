from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend domain in production
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return 'ok'

@app.get("/proxy/csv")
async def proxy_csv(url: str):
    """
    # Create a streaming response

    testing:

        ```bash
        export EXAMPLE_CSV_URL=https://www.stats.govt.nz/assets/Uploads/Business-operations-survey/Business-operations-survey-2022/Download-data/business-operations-survey-2022-business-finance.csv
        curl "http://localhost:8000/proxy/csv?url=$EXAMPLE_CSV_URL" > downloaded.csv
        ```
    """
    async def stream_csv():
        try:
            # Set a timeout for the request (30 seconds)
            async with httpx.AsyncClient(timeout=30.0) as client:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
