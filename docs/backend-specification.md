MainData.id - Backend Specification
===================================

## 1. **Tech Stack**

| Area | Stack |
|:-----|:------|
| Web Framework | **FastAPI** |
| LLM Proxy | **LiteLLM** (OpenAI, Mistral, etc.) |
| Vector DB | **Supabase Postgres + pgvector** |
| Database ORM | **SQLAlchemy + Alembic** |
| Embeddings | Google's Gemini |
| Session Memory | **PostgreSQL** (in Supabase) |
| Deployment | Uvicorn / Fly.io / Docker |

---

## 2. **Backend Responsibilities**

- Handle chat-based NL → SQL queries.
- Maintain long-lived chat sessions with memory.
- Perform dual RAG: dataset catalog + reference queries.
- Feed full session history into LLM via LiteLLM.
- Return SQL + explanation + context.

---

## 3. **Database Schema (PostgreSQL via Supabase)**

### `dataset_catalog`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| title | TEXT | Dataset title |
| description | TEXT | Short description |
| url | TEXT | Link to source |
| embedding | VECTOR(1536) | pgvector |

---

### `reference_queries`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| title | TEXT | Example title |
| description | TEXT | Query explanation |
| sql_query | TEXT | SQL string |
| embedding | VECTOR(1536) | pgvector |

---

### `chat_sessions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| created_at | TIMESTAMP | Start time of chat |
| title | TEXT | Optional session title |

---

### `chat_messages`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| session_id | UUID | FK to `chat_sessions` |
| role | TEXT | "user" or "assistant" |
| content | TEXT | The actual message |
| created_at | TIMESTAMP | Auto timestamp |

---

## 4. **API Spec**

### `POST /generate-sql`

Request:
```json
{
  "session_id": "d6e4e...,",
  "question": "tambahkan filter hanya untuk tahun 2020"
}
```

Response:
```json
{
  "sql": "...",
  "datasets_used": [...],
  "reference_queries_used": [...],
  "explanation": "...",
  "messages": [ ... chat history ... ]
}
```

---

### `POST /start-session`

Creates a new chat session.

Response:
```json
{
  "session_id": "d6e4e...", 
  "created_at": "2025-04-25T10:00:00Z"
}
```

---

### `GET /session/{session_id}`

Returns the full chat history.

---

## 5. **Updated Architecture Flow**

```
User Input --> 
FastAPI Backend:
  - Load chat history from DB
  - Embed question
  - RAG on datasets + example queries
  - Compose prompt w/ context
  - Call LLM via LiteLLM
  - Save assistant response in DB
  - Return generated SQL + explanation
```

---

## 6. **Prompt Template (Improved)**

```text
You are an AI data analyst.

Conversation so far:
{chat_history}

Relevant Datasets:
{dataset_summaries}

Relevant Example Queries:
{reference_sql_examples}

Given the user’s latest question: {user_question}
Write the best SQL query to answer it.
```

---

## 7. **Backend Folder Structure**

```
backend/
├── app/
│   ├── main.py
│   ├── routes/
│   │   ├── generate_sql.py
│   │   ├── session.py
│   ├── models/
│   │   ├── db.py           # SQLAlchemy models
│   │   └── schema.py       # Pydantic schemas
│   ├── services/
│   │   ├── rag_dataset.py
│   │   ├── rag_sql.py
│   │   ├── llm.py
│   │   └── memory.py       # Load/save chat from DB
│   └── utils/
│       └── embedding.py
├── alembic/                # Migrations
├── requirements.txt
└── .env
```

