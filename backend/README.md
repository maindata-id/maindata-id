# MainData.id Backend API

This FastAPI application provides the backend API for MainData.id, a natural language to SQL translator focused on Indonesian government data.

## Features

- Natural language to SQL generation via LLM
- RAG (Retrieval Augmented Generation) for context-aware SQL generation
- Conversational memory for maintaining chat context
- Vector search for relevant datasets and reference queries
- PostgreSQL + pgvector for database and vector storage

## Tech Stack

- FastAPI: Web framework
- SQLAlchemy + Alembic: ORM and migrations
- PostgreSQL: Database
- pgvector: Vector extensions for PostgreSQL
- LiteLLM: LLM proxy for various providers (OpenAI, etc.)

## Setup and Installation

### Prerequisites

- Python 3.9+
- PostgreSQL with pgvector extension
- Supabase account (optional, for hosted PostgreSQL)

### Setup

see README in parent folder

## API Documentation

When the application is running, you can access the auto-generated API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Core Endpoints

- `POST /generate-sql`: Generate SQL from natural language
- `POST /start-session`: Create a new chat session
- `GET /session/{session_id}`: Get chat history for a session

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── routes/                  # API route handlers
│   ├── models/                  # Database models and schemas
│   ├── services/                # Business logic
│   └── utils/                   # Utility functions
├── alembic/                     # Database migrations
├── scripts/                     # Utility scripts
└── requirements.txt             # Dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request
