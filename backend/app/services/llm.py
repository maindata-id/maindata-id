import os
from typing import Dict, List, Any
from dotenv import load_dotenv
import google.generativeai as genai
from app.models.schema import DatasetReference, QueryReference, MessageModel

# Load environment variables
load_dotenv()

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the model
model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')

async def generate_sql_from_nl(
    question: str,
    chat_history: List[MessageModel],
    datasets: List[DatasetReference],
    reference_queries: List[QueryReference]
) -> Dict[str, str]:
    """
    Generate SQL from natural language using Gemini with context
    """
    # Format chat history
    formatted_history = "\n".join([
        f"{msg.role.capitalize()}: {msg.content}" 
        for msg in chat_history
    ])
    
    # Format dataset information
    dataset_context = "\n".join([
        f"- {dataset.title} [url: {dataset.url}]: {dataset.description}"
        for dataset in datasets
    ])
    
    # Format reference queries
    reference_context = "\n".join([
        f"- Title: {ref.title}\n  Description: {ref.description}\n  SQL: {ref.sql_query}"
        for ref in reference_queries
    ])
    
    # Create prompt with context
    prompt = f"""You are an AI data analyst specialized in generating SQL queries for Indonesian government data.
Your task is to translate natural language questions into valid SQL queries in DuckDB dialect.

When generating SQL:
1. Focus on clarity and correctness
2. Include comments to explain your approach
3. Consider the Indonesian context of the data
4. Make use of the example queries if relevant
5. Return both the SQL and a brief explanation
6. Because the SQL query would be used in an ephemeral duckdb environment, make sure to always load the data from URL source using `CREATE TABLE local_table_name AS SELECT * FROM read_csv(<CSV_URL>);` query before doing the actual SQL query.

Conversation history:
{formatted_history if formatted_history else "No previous conversation."}

Relevant datasets:
{dataset_context if dataset_context else "No specific dataset information available."}

Reference SQL examples:
{reference_context if reference_context else "No reference examples available."}

Question: {question}

Please generate a SQL query to answer this question, along with a brief explanation of your approach.
"""
    
    try:
        # Generate response using Gemini
        response = await model.generate_content_async(prompt)
        response_text = response.text
        
        # Process the response to extract SQL and explanation
        if "```sql" in response_text:
            # Extract SQL from code block
            sql_parts = response_text.split("```sql")
            sql_code = sql_parts[1].split("```")[0].strip()
            
            # Attempt to extract explanation
            explanation = response_text.replace(f"```sql{sql_code}```", "").strip()
        else:
            # Fallback if no code block format
            lines = response_text.split("\n")
            sql_lines = []
            explanation_lines = []
            
            in_sql = False
            for line in lines:
                if line.lower().startswith(("select", "with", "create", "insert", "update", "delete")) and not in_sql:
                    in_sql = True
                    sql_lines.append(line)
                elif in_sql and line.strip().endswith(";"):
                    sql_lines.append(line)
                    in_sql = False
                elif in_sql:
                    sql_lines.append(line)
                else:
                    explanation_lines.append(line)
                    
            sql_code = "\n".join(sql_lines).strip()
            explanation = "\n".join(explanation_lines).strip()
            
            # If we couldn't parse it cleanly
            if not sql_code:
                sql_code = "-- Could not extract SQL code automatically"
                explanation = response_text
        
        return {
            "sql": sql_code,
            "explanation": explanation
        }
    except Exception as e:
        # Return error information
        return {
            "sql": f"-- Error generating SQL: {str(e)}",
            "explanation": f"An error occurred while generating SQL: {str(e)}"
        }
