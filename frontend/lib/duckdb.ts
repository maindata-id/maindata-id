import { mockData } from "./mock-data"

// Flag to indicate we're using mock data
const useMockData = true

// Mock implementation of initDuckDB
export async function initDuckDB(): Promise<void> {
  console.log("Using mock DuckDB implementation")
  // Simulate a delay to mimic initialization
  await new Promise((resolve) => setTimeout(resolve, 500))
  return Promise.resolve()
}

// Execute a SQL query using mock data
export async function executeQuery(sql: string): Promise<any[]> {
  console.log("Executing mock query:", sql)

  // Simulate query execution delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return getMockQueryResults(sql)
}

// Function to get mock query results
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
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return ["population_dki", "education_budget", "poverty_rate", "hdi_data"]
}

// Get schema for a specific table
export async function getTableSchema(tableName: string): Promise<{ name: string; type: string }[]> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 300))

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
