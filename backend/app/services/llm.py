import os
from typing import Dict, List, Any, AsyncGenerator
from dotenv import load_dotenv
import google.generativeai as genai
from app.models.schema import DatasetReference, QueryReference, MessageModel

# Load environment variables
load_dotenv()

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the model
model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')

def _create_prompt(
    question: str,
    chat_history: List[MessageModel],
    datasets: List[DatasetReference],
    reference_queries: List[QueryReference]
) -> str:
    """
    Create the prompt for SQL generation
    """
    # Format chat history
    formatted_history = "\n".join([
        f"{msg.role.capitalize()}: {msg.content}" 
        for msg in chat_history
    ])
    
    # Format dataset information with table creation
    dataset_context = "\n".join([
        f"- {dataset.title}: {dataset.description}\n  Data URL: {API_BASE_URL}/dataset/{dataset.slug}"
        for dataset in datasets
    ])
    
    # Format reference queries
    reference_context = "\n".join([
        f"- Title: {ref.title}\n  Description: {ref.description}\n  SQL: {ref.sql_query}"
        for ref in reference_queries
    ])
    
    return f"""You are an AI data analyst specialized in generating SQL queries for Indonesian government data.
Your task is to translate natural language questions into valid SQL queries using DuckDB dialect.

When generating SQL:
1. Focus on clarity and correctness
2. Include comments to explain your approach
3. Consider the Indonesian context of the data
4. Make use of the example queries if relevant
5. Use DuckDB SQL dialect
6. ALWAYS include the necessary data loading statements in your SQL
7. For each dataset used, first load it using:
   CREATE TABLE IF NOT EXISTS <table_name> AS SELECT * FROM read_csv('<url>');
8. Use descriptive table names based on the dataset title (lowercase with underscores)
9. Include all necessary data loading statements before the actual query

IMPORTANT: Format your response exactly as follows:
1. First, provide a clear explanation of your approach
2. Then add a line containing exactly 14 equals signs: ==============
3. Finally, provide the SQL query, including:
   - ALL required data loading statements first
   - The actual query second

Conversation history:
{formatted_history if formatted_history else "No previous conversation."}

Available datasets:
{dataset_context if dataset_context else "No specific dataset information available."}

Reference SQL examples:
{reference_context if reference_context else "No reference examples available."}

Question: {question}

Please generate a SQL query to answer this question, following the format specified above.
"""

async def generate_sql_from_nl(
    question: str,
    chat_history: List[MessageModel],
    datasets: List[DatasetReference],
    reference_queries: List[QueryReference]
) -> Dict[str, str]:
    """
    Generate SQL from natural language using Gemini with context
    """
    try:
        prompt = _create_prompt(question, chat_history, datasets, reference_queries)
        response = await model.generate_content_async(prompt)
        return {
            "sql": response.text,
            "explanation": ""  # No need to parse as frontend will handle it
        }
    except Exception as e:
        return {
            "sql": f"Error generating SQL: {str(e)}",
            "explanation": f"An error occurred: {str(e)}"
        }

async def generate_sql_stream(
    question: str,
    chat_history: List[MessageModel],
    datasets: List[DatasetReference],
    reference_queries: List[QueryReference]
) -> AsyncGenerator[str, None]:
    """
    Stream SQL generation results
    """
    try:
        prompt = _create_prompt(question, chat_history, datasets, reference_queries)
        response = await model.generate_content_async(
            prompt,
            stream=True  # Enable streaming
        )
        
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Error generating SQL: {str(e)}"
