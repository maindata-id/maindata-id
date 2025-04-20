# Web App Summary: MainData.id

## **Problem**

Publicly available government data in Indonesia is underutilized due to the fragmented access, need for technical expertise, and lack of unified tools for querying and visualization.

### **Solution**

A web-based data lab that simplifies the discovery, querying, and visualization of open Indonesian government data—powered by DuckDB and natural language to SQL translation via LLM.

---

## **Target Users**

- Civil servants
- Researchers
- Students
- Academia

---

## **Core Features for MVP**

1. **Searchable Dataset Catalog**
    - Pull metadata from national/local open data portals (e.g., data.go.id)
    - Allow keyword-based search with filters (e.g., topic, provider, date)
2. **SQL Query Interface**
    - DuckDB backend
    - Query execution in browser
    - Display results in table + optional chart view (e.g., bar, line)
3. **LLM-Powered Natural Language to SQL**
    - Simple input box for queries like “Show population of Jakarta by year”
    - LLM translates it into SQL for execution

---

## **User Flow (MVP)**

1. **Landing Page**
    - Big central input box: *“Ask a question about Indonesian government data…”*
    - Display example queries underneath:
        - “Jumlah penduduk DKI Jakarta tiap tahun”
        - “Anggaran pendidikan tertinggi di tahun 2022”
        - “Provinsi dengan angka kemiskinan tertinggi tahun lalu”
2. **LLM Processes Question**
    - Translates question → SQL
    - Identifies relevant dataset (from catalog)
    - Loads it into DuckDB
3. **Query UI Page**
    - Shows SQL query (editable)
    - User can run/edit the SQL
    - Displays results in table + optional visualization
4. **Optional: Link to dataset catalog**
    - For users who want to explore datasets manually

## **Landing Page UI (Natural Language First)**

```sql
+--------------------------------------------------------+
| OpenData Lab Indonesia                                 |
| [optional logo]                                        |
|--------------------------------------------------------|
| Ask a question about Indonesian government data:       |
|                                                        |
| [--------------------------------------------------]   |
| |  e.g. Jumlah penduduk DKI Jakarta tiap tahun     |   |
| [--------------------------------------------------]   |
|                                                        |
| Popular questions:                                     |
| • Anggaran pendidikan tertinggi di tahun 2022          |
| • Provinsi dengan angka kemiskinan tertinggi tahun lalu|
| • Rata-rata IPM di Sumatera Barat sejak 2010           |
|                                                        |
| [ See all datasets ]                                   |
+--------------------------------------------------------+
 
```

## Query Interface UI

```sql
+--------------------------------------------------------+
| Dataset: Penduduk DKI Jakarta                          |
|--------------------------------------------------------|
| SQL (editable):                                        |
| SELECT year, population                                |
| FROM population_dki                                    |
| ORDER BY year ASC;                                     |
|                                                        |
| [ Run Query ]                                          |
|                                                        |
|--------------------------------------------------------|
| Results (Table View):                                  |
| +------+------------+                                  |
| | Year | Population |                                  |
| +------+------------+                                  |
| | 2018 | 10,250,000 |                                  |
| | 2019 | 10,400,000 |                                  |
| +------+------------+                                  |
|                                                        |
| [ Show Chart ] [ Download CSV ]                        |
+--------------------------------------------------------+

```

