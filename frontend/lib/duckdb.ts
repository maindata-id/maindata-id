// Add a check to ensure this only runs on the client side
const isBrowser = typeof window !== "undefined"

// Import DuckDB only if in browser
let duckdb: typeof import("@duckdb/duckdb-wasm") | null = null

// DuckDB instance
let db: any | null = null
let conn: any | null = null
let isInitializing = false
let initPromise: Promise<void> | null = null

// Initialize DuckDB
export async function initDuckDB(): Promise<void> {
  if (!isBrowser) {
    throw new Error("DuckDB can only be initialized in the browser")
  }

  if (db !== null) return // Already initialized
  if (initPromise) return initPromise // Already initializing

  isInitializing = true

  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Dynamically import DuckDB
      duckdb = await import("@duckdb/duckdb-wasm")

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
  if (!isBrowser) {
    throw new Error("DuckDB can only be used in the browser")
  }

  if (!conn) {
    throw new Error("DuckDB connection not available")
  }

  console.log("Executing single query:", sql)

  const startTime = performance.now()

  try {
    // Execute the query
    const result = await conn.query(sql)

    const endTime = performance.now()
    console.log(`Query executed in ${(endTime - startTime).toFixed(2)}ms`)

    // Convert to array of objects
    return result.toArray().map((row) => row.toJSON())
  } catch (error) {
    const endTime = performance.now()
    console.error(`Query failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
    throw error
  }
}

// Execute multiple SQL queries
export interface QueryResult {
  sql: string
  results: any[]
  isError: boolean
  errorMessage?: string
  isDdl: boolean
  isDataModifying: boolean
  executionTime?: number
}

// Execute a SQL query (which may contain multiple statements)
export async function executeQuery(sql: string): Promise<QueryResult[]> {
  if (!isBrowser) {
    return [
      {
        sql,
        results: [],
        isError: true,
        errorMessage: "DuckDB can only be used in the browser",
        isDdl: false,
        isDataModifying: false,
      },
    ]
  }

  const totalStartTime = performance.now()

  try {
    // Import the SQL parser only when needed
    const { splitSqlQueries, isDdlStatement, isDataModifyingStatement } = await import("./sql-parser")

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
      const queryStartTime = performance.now()

      try {
        const isDdl = isDdlStatement(query)
        const isDataModifying = isDataModifyingStatement(query)

        const queryResult = await executeSingleQuery(query)
        const queryEndTime = performance.now()
        const executionTime = queryEndTime - queryStartTime

        results.push({
          sql: query,
          results: queryResult,
          isError: false,
          isDdl,
          isDataModifying,
          executionTime,
        })
      } catch (error: any) {
        const queryEndTime = performance.now()
        const executionTime = queryEndTime - queryStartTime

        console.error(`Error executing query "${query}":`, error)

        results.push({
          sql: query,
          results: [],
          isError: true,
          errorMessage: error.message || "Unknown error",
          isDdl: isDdlStatement(query),
          isDataModifying: isDataModifyingStatement(query),
          executionTime,
        })
      }
    }

    const totalEndTime = performance.now()
    console.log(`Total query execution time: ${(totalEndTime - totalStartTime).toFixed(2)}ms`)

    return results
  } catch (error: any) {
    // If there's an error outside the individual query execution
    const totalEndTime = performance.now()
    console.error(`Query execution error after ${(totalEndTime - totalStartTime).toFixed(2)}ms:`, error)
    throw error
  }
}

// Get available tables
export async function getTables(): Promise<string[]> {
  if (!isBrowser) {
    return []
  }

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
  if (!isBrowser) {
    return []
  }

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
