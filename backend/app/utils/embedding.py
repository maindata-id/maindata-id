import os
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv
import numpy as np

# Load environment variables
load_dotenv()

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

async def get_embedding(text: str) -> Optional[List[float]]:
    """
    Get embedding vector for text using Gemini API
    """
    if not GOOGLE_API_KEY:
        raise ValueError("Missing Google API key")
        
    try:
        # Get embeddings using Gemini
        embedding_model = genai.GenerativeModel('embedding-001')
        result = embedding_model.embed_content(text)
        
        # Return the embedding values
        return result.values
            
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None

async def compute_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Compute cosine similarity between two embeddings
    """
    a = np.array(embedding1)
    b = np.array(embedding2)
    
    # Cosine similarity
    similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    return float(similarity)