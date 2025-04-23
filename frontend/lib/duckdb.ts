import * as duckdb from "@duckdb/duckdb-wasm"
import { mockData } from "./mock-data"

// DuckDB instance
let db: duckdb.AsyncDuckDB | null = null
let conn: duckdb.AsyncDuckDBConnection | null = null
let isInitializing = false
let initPromise: Promise<void> | null = null
let useMockData = false

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

      // Load sample data
      await loadSampleData()

      isInitializing = false
      useMockData = false
      resolve()
    } catch (error) {
      console.error("Failed to initialize DuckDB:", error)
      useMockData = true
      isInitializing = false
      reject(error)
    }
  })

  return initPromise
}

// Load sample data into DuckDB
async function loadSampleData(): Promise<void> {
  if (!conn) throw new Error("DuckDB connection not initialized")

  try {
    // Create tables for each dataset
    await conn.query(`
      CREATE TABLE population_dki (
        year INTEGER,
        population INTEGER
      )
    `)

    await conn.query(`
      CREATE TABLE education_budget (
        province VARCHAR,
        year INTEGER,
        budget BIGINT
      )
    `)

    await conn.query(`
      CREATE TABLE poverty_rate (
        province VARCHAR,
        year INTEGER,
        poverty_rate FLOAT
      )
    `)

    await conn.query(`
      CREATE TABLE hdi_data (
        province VARCHAR,
        year INTEGER,
        hdi_score FLOAT
      )
    `)

    // Insert data from our mock data
    for (const row of mockData.population_dki) {
      await conn.query(`
        INSERT INTO population_dki VALUES (${row.year}, ${row.population})
      `)
    }

    for (const row of mockData.education_budget) {
      await conn.query(`
        INSERT INTO education_budget VALUES ('${row.province}', ${row.year}, ${row.budget})
      `)
    }

    for (const row of mockData.poverty_rate) {
      await conn.query(`
        INSERT INTO poverty_rate VALUES ('${row.province}', ${row.year}, ${row.poverty_rate})
      `)
    }

    for (const row of mockData.hdi_data) {
      await conn.query(`
        INSERT INTO hdi_data VALUES ('${row.province}', ${row.year}, ${row.hdi_score})
      `)
    }

    console.log("Sample data loaded successfully")
  } catch (error) {
    console.error("Error loading sample data:", error)
    throw error
  }
}

// Function to check if an error is a SQL syntax error
function isSqlSyntaxError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.toString().toLowerCase()

  // Common SQL syntax error patterns
  const syntaxErrorPatterns = [
    "syntax error",
    "parse error",
    "unexpected token",
    "expected",
    "missing",
    "invalid syntax",
    "unknown column",
    "table not found",
    "ambiguous column",
    "no such table",
    "no such column",
  ]

  return syntaxErrorPatterns.some((pattern) => errorMessage.includes(pattern.toLowerCase()))
}

// Execute a SQL query
export async function executeQuery(sql: string): Promise<any[]> {
  try {
    // If we're using mock data due to DuckDB failure, return mock data directly
    if (useMockData) {
      return getMockQueryResults(sql)
    }

    // Initialize DuckDB if not already initialized
    if (!db || !conn) {
      try {
        await initDuckDB()
      } catch (error) {
        console.error("Failed to initialize DuckDB, falling back to mock data:", error)
        useMockData = true
        return getMockQueryResults(sql)
      }
    }

    if (!conn) {
      throw new Error("DuckDB connection not available")
    }

    console.log("Executing query:", sql)

    try {
      // Execute the query
      const result = await conn.query(sql)

      // Convert to array of objects
      return result.toArray().map((row) => row.toJSON())
    } catch (error) {
      console.error("Query execution error:", error)

      // Check if it's a SQL syntax error
      /*if (isSqlSyntaxError(error)) {
        // For SQL syntax errors, just throw the error without falling back to mock data
        console.log("SQL syntax error detected, not falling back to mock data")
        throw error
      } else {
        // For other errors that might indicate DuckDB isn't working, fall back to mock data
        console.log("Non-syntax error detected, falling back to mock data")
        useMockData = true
        return getMockQueryResults(sql)
      }
      */
      throw error
    }
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error
  }
}

// Fallback function to get mock query results
function getMockQueryResults(sql: string): any[] {
  console.log("Using mock data for query:", sql)

  // Simple SQL parser to determine which dataset to use
  const sqlLower = sql.toLowerCase()

  if (sqlLower.includes("population_dki") || sqlLower.includes("penduduk")) {
    return mockData.population_dki
  }

  if (sqlLower.includes("education_budget") || sqlLower.includes("anggaran pendidikan")) {
    return mockData.education_budget
  }

  if (sqlLower.includes("poverty_rate") || sqlLower.includes("kemiskinan")) {
    return mockData.poverty_rate
  }

  if (sqlLower.includes("hdi_data") || sqlLower.includes("ipm")) {
    return mockData.hdi_data
  }

  // Default to population data if we can't determine the dataset
  return mockData.population_dki
}

// Get available tables
export async function getTables(): Promise<string[]> {
  // If we're using mock data due to DuckDB failure, return mock table names
  if (useMockData) {
    return ["population_dki", "education_budget", "poverty_rate", "hdi_data"]
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
    useMockData = true
    return ["population_dki", "education_budget", "poverty_rate", "hdi_data"]
  }
}

// Get schema for a specific table
export async function getTableSchema(tableName: string): Promise<{ name: string; type: string }[]> {
  // If we're using mock data due to DuckDB failure, return mock schema
  if (useMockData) {
    switch (tableName) {
      case "population_dki":
        return [
          { name: "year", type: "INTEGER" },
          { name: "population", type: "INTEGER" },
        ]
      case "education_budget":
        return [
          { name: "province", type: "VARCHAR" },
          { name: "year", type: "INTEGER" },
          { name: "budget", type: "BIGINT" },
        ]
      case "poverty_rate":
        return [
          { name: "province", type: "VARCHAR" },
          { name: "year", type: "INTEGER" },
          { name: "poverty_rate", type: "FLOAT" },
        ]
      case "hdi_data":
        return [
          { name: "province", type: "VARCHAR" },
          { name: "year", type: "INTEGER" },
          { name: "hdi_score", type: "FLOAT" },
        ]
      default:
        return []
    }
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
    useMockData = true

    // Return mock schema based on table name
    return getTableSchema(tableName)
  }
}

// Check if we're using mock data
export function isUsingMockData(): boolean {
  return useMockData
}

// Reset mock data flag (useful for testing)
export function resetMockDataFlag(): void {
  useMockData = false
}
