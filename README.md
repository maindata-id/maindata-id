# 🏛️ MainData.id

> 🔍 Your AI-powered companion to explore, query, and make sense of Indonesia’s public data — all in one tool.

---

## ✨ What is MainData.id?

**MainData.id** is a modern web-based platform that helps people **search, understand, query, and analyze open government data** from Indonesia — without needing to download, clean, or manually write SQL.

### 💡 Why?
Despite many government open data initiatives, the current user journey is still fragmented:
- Search across portals to find the right dataset.
- Download multiple CSV/Excel files.
- Learn the structure and metadata manually.
- Load into a spreadsheet or SQL engine.
- Write custom queries and build charts.

**MainData.id makes all that just one step: Ask your question, get instant SQL & answers.**

---

## 👥 Who is it for?

- 📊 **Civil servants** working with public dashboards and policy research.
- 🎓 **Students & educators** looking to teach or learn data literacy.
- 🔬 **Researchers** doing data-driven investigations.
- 🧑‍💻 **Developers** building tools using public data.

---

## 🧠 Key Features

- 🔍 **Ask in Natural Language**  
  “Berapa jumlah penduduk DKI Jakarta tiap tahun?” → auto-generated SQL.

- 📚 **Smart Dataset Catalog**  
  All datasets are indexed in a vector database so the app knows which data to use — and why.

- 🧠 **RAG + LLM Engine**  
  We use a Retrieval-Augmented Generation approach powered by [LiteLLM](https://github.com/BerriAI/litellm) — so you can plug in OpenAI, Mistral, Anthropic, etc.

- ⚡ **In-browser SQL Engine**  
  DuckDB-WASM runs entirely in your browser. No data leaves your computer. Blazing fast.

- 🪶 **Lightweight by design**  
  No sign-up, no chat history. Just ask, explore, and move forward.

---

## 🏗️ Architecture

![Architecture Document](./docs/architecture.md)

### 🔹 Frontend: `Next.js`  
- User inputs a natural language question.
- Sends the question to the backend.
- Receives generated SQL and runs it using DuckDB-WASM.
- Displays results and charts.

### 🔹 Backend: `FastAPI` + `LiteLLM`  
- Receives user input.
- Embeds the query and performs semantic search (RAG) in Supabase.
- Builds a context-aware prompt.
- Calls LLM (via LiteLLM) to generate SQL.
- Returns generated SQL back to frontend.

### 🔹 Supabase  
- Hosts the vectorized dataset catalog.
- Enables RAG for dataset understanding.

---

## 📁 Project Structure

```
opendata-lab/
├── frontend/ # Next.js UI, DuckDB, user interaction
├── backend/ # FastAPI server, RAG engine, LiteLLM
├── docs/ # projects documentation
```

---

## 🧪 Local Development

### 🚀 Run Frontend

```bash
cd frontend
pnpm install
pnpm dev

```
### ⚙️ Run Backend

```
cd backend
uv install

# for dev
uv run fastapi dev --host 0.0.0.0

# for prod
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📬 Roadmap

- [ ] MVP with NL → SQL + DuckDB
- [ ] RAG-enhanced query understanding
- [ ] Chart suggestion + auto-viz
- [ ] One-click CSV upload for user datasets
- [ ] Dataset versioning and provenance info

## 🤝 Contributing

We currently doesn't accept pull requests, but we are very open for ideas & suggestions! We would also really appreaciate if you spread the words about this project.

## 📃 License

[GNU AFFERO GENERAL PUBLIC LICENSE ver 3](https://www.gnu.org/licenses/agpl-3.0.en.html)

## 💬 Made for Indonesia 🇮🇩

We believe public data should be truly accessible — not just downloadable.
Let’s make data a common good, not a technical barrier.
