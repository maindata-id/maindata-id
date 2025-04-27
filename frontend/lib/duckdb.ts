import * as duckdb from "@duckdb/duckdb-wasm"
import { splitSqlQueries, isDdlStatement, isDataModifyingStatement } from "./sql-parser"

// DuckDB instance
let db: duckdb.AsyncDuckDB | null = null
let conn: duckdb.AsyncDuckDBConnection | null = null
let isInitializing = false
let initPromise: Promise<void> | null = null

// Initialize DuckDB
export async function initDuckDB(): Promise<void> {
  if (db !== null) return // Already initialized
  if (initPromise) return initPromise // Already initializing

  isInitializing = true

  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Create a logger
      const logger = new duckdb.ConsoleLogger()

      // Using the provided snippet for initialization
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()

      // For debugging
      console.log("DuckDB bundles:", JSDELIVR_BUNDLES)

      // Select a bundle based on browser checks
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)
      console.log("Selected bundle:", bundle)

      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" }),
      )

      // Instantiate the asynchronous version of DuckDB-Wasm
      const worker = new Worker(worker_url)
      db = new duckdb.AsyncDuckDB(logger, worker)

      try {
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
        URL.revokeObjectURL(worker_url)
        console.log("DuckDB instantiated successfully")
      } catch (instError) {
        console.error("DuckDB instantiation error:", instError)
        URL.revokeObjectURL(worker_url)
        throw instError
      }

      // Create a connection
      try {
        conn = await db.connect()
        console.log("DuckDB connection established")
      } catch (connError) {
        console.error("DuckDB connection error:", connError)
        throw connError
      }

      isInitializing = false
      resolve()
    } catch (error) {
      console.error("Failed to initialize DuckDB:", error)
      isInitializing = false
      reject(error)
    }
  })

  return initPromise
}

// Execute a single SQL query
export async function executeSingleQuery(sql: string): Promise<any[]> {
  if (!conn) {
    throw new Error("DuckDB connection not available")
  }

  console.log("Executing single query:", sql)

  // Execute the query
  const result = await conn.query(sql)

  // Convert to array of objects
  return result.toArray().map((row) => row.toJSON())
}

// Execute multiple SQL queries
export interface QueryResult {
  sql: string
  results: any[]
  isError: boolean
  errorMessage?: string
  isDdl: boolean
  isDataModifying: boolean
}

// Execute a SQL query (which may contain multiple statements)
export async function executeQuery(sql: string): Promise<QueryResult[]> {
  try {
    // Initialize DuckDB if not already initialized
    if (!db || !conn) {
      try {
        await initDuckDB()
      } catch (error) {
        console.error("Failed to initialize DuckDB:", error)
        throw error
      }
    }

    if (!conn) {
      throw new Error("DuckDB connection not available")
    }

    // Split the SQL into individual queries
    const queries = splitSqlQueries(sql)
    console.log(`Split SQL into ${queries.length} queries:`, queries)

    // If no valid queries, return empty result
    if (queries.length === 0) {
      return []
    }

    // Execute each query and collect results
    const results: QueryResult[] = []

    for (const query of queries) {
      try {
        const isDdl = isDdlStatement(query)
        const isDataModifying = isDataModifyingStatement(query)

        const queryResult = await executeSingleQuery(query)

        results.push({
          sql: query,
          results: queryResult,
          isError: false,
          isDdl,
          isDataModifying,
        })
      } catch (error: any) {
        console.error(`Error executing query "${query}":`, error)

        results.push({
          sql: query,
          results: [],
          isError: true,
          errorMessage: error.message || "Unknown error",
          isDdl: isDdlStatement(query),
          isDataModifying: isDataModifyingStatement(query),
        })
      }
    }

    return results
  } catch (error: any) {
    // If there's an error outside the individual query execution
    console.error("Query execution error:", error)
    throw error
  }
}

// Get available tables
export async function getTables(): Promise<string[]> {
  try {
    if (!db || !conn) {
      await initDuckDB()
    }

    if (!conn) {
      throw new Error("DuckDB connection not available")
    }

    const result = await conn.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'main'
    `)

    return result.toArray().map((row) => row[0] as string)
  } catch (error) {
    console.error("Error getting tables:", error)
    throw error
  }
}

// Get schema for a specific table
export async function getTableSchema(tableName: string): Promise<{ name: string; type: string }[]> {
  try {
    if (!db || !conn) {
      await initDuckDB()
    }

    if (!conn) {
      throw new Error("DuckDB connection not available")
    }

    const result = await conn.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      AND table_schema = 'main'
    `)

    return result.toArray().map((row) => ({
      name: row[0] as string,
      type: row[1] as string,
    }))
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error)
    throw error
  }
}

// Check DuckDB status
export function getDuckDBStatus(): { isInitialized: boolean; isInitializing: boolean } {
  return {
    isInitialized: db !== null && conn !== null,
    isInitializing: isInitializing,
  }
}
