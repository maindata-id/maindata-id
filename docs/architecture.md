ARCHITECTURE
============

## **Architecture Overview**

```
User → Frontend (Next.js) 
     → Natural Language Input 
         → LLM API (GPT-4) → SQL 
         → DuckDB (WASM in browser) → Results → UI Table + Chart
     → Catalog Search (static JSON or API)
```
## **Planned Tech Stack**

### **Frontend**

- **Framework:** [Next.js](https://nextjs.org/) (React-based, fast, server-side rendering + static support)
- **Styling:** Tailwind CSS (utility-first, easy to theme)
- **UI Components:** shadcn/ui or Radix UI (clean, accessible React components)
- **Charting:** Recharts or Chart.js (for visualizing query results)

### **Backend**

- **Server:** API Routes in Next.js (if using serverless) or a simple Express/FastAPI server (if self-hosted)
- **Database Engine:** **DuckDB (in-browser via WASM)**
    
    Ideal for fast, local querying of static open datasets
    
- **Dataset Catalog Storage:** JSON or SQLite (if small); can be upgraded later

### **LLM Integration**

- **API:** LiteLLM for flexible LLM provider access
    
    Use it to generate SQL from natural language. You can use prompt templates with context about available tables.
    

### **Deployment**

- **Hosting:** Vercel (great with Next.js) or Netlify
- **Data Storage:** Host static datasets as Parquet/CSV in public cloud storage (e.g., GitHub, S3, or Vercel assets)
- **Optional:** Use DuckDB extensions or DuckDB-Wasm for offline processing

---

## **How This Could Work**

### **1. Embed Dataset Metadata**

Create embeddings from:

- Dataset titles
- Descriptions
- Column names
- Sample rows (optional, for more context)

Store in:

- **Vector DB:** like **Weaviate**, **Qdrant**, **Pinecone**, or **Supabase Vector** (if you want Postgres+Vectors)

### **2. Semantic Query Search**

User input → vector search → return top N most relevant datasets → extract their schema/snippets

### **3. RAG-enhanced Prompt**

Use the result to create a prompt like:

> "You are a SQL expert. Based on the dataset below, generate a SQL query for: 'jumlah penduduk dki jakarta tiap tahun'
> 
> 
> **Relevant dataset:** Penduduk DKI Jakarta
> 
> **Columns:** year, population
> 
> **Sample rows:** [2018, 10250000], [2019, 10400000]"
> 

### **4. DuckDB runs the SQL locally**

---

## **RAG Catalog + LLM + DuckDB: Flow**

```
User → Input Question
    → Vector DB → Find relevant datasets
    → Build context → LLM → Generate SQL
    → DuckDB (in-browser) → Run query → Show result

```

