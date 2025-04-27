import { generateSQL, startSession, type Dataset, type QueryReference } from "./api-client"

// Store the session ID
let currentSessionId: string | null = null

/**
 * Set the current session ID
 */
export function setCurrentSessionId(sessionId: string) {
  currentSessionId = sessionId
  console.log("Set session ID:", sessionId)
}

/**
 * Initialize a session if one doesn't exist
 */
export async function ensureSession(): Promise<string> {
  if (!currentSessionId) {
    try {
      const session = await startSession("MainData.id Explorer Session")
      currentSessionId = session.session_id
      console.log("Created new session:", currentSessionId)
    } catch (error) {
      console.error("Failed to create session:", error)
      throw error
    }
  }
  return currentSessionId
}

/**
 * Translate natural language to SQL
 */
export async function translateToSql(naturalLanguageQuery: string): Promise<{
  sql: string
  datasetName: string
  explanation?: string
  datasets?: Dataset[]
  references?: QueryReference[]
}> {
  console.log("Translating to SQL:", naturalLanguageQuery)

  try {
    // Ensure we have a session
    const sessionId = await ensureSession()

    // Call the API to generate SQL
    const result = await generateSQL(sessionId, naturalLanguageQuery)

    // Extract dataset name from the first dataset if available
    const datasetName = result.datasets_used.length > 0 ? result.datasets_used[0].title : "Query Result"

    return {
      sql: result.sql,
      datasetName,
      explanation: result.explanation,
      datasets: result.datasets_used,
      references: result.reference_queries_used,
    }
  } catch (error) {
    console.error("Error translating to SQL:", error)

    // Create a more user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred while communicating with the translation service"

    // Return a SQL query that will display the error message
    return {
      sql: `SELECT 'API Error: ${errorMessage.replace(/'/g, "''")}' as error_message`,
      datasetName: "Error",
      explanation: `There was an error communicating with the translation service: ${errorMessage}`,
    }
  }
}
