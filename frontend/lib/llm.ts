import { startSession, type Dataset, type QueryReference } from "./api-client"
import { debugLogSSE } from "./debug-utils"

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
 * Parse the streaming response from the API
 * The format is:
 * EXPLANATIONS....
 * ===========
 * SQL Queries
 */
export function parseStreamingResponse(text: string): { explanation: string; sql: string } {
  // First, check if the text starts with "===" and remove it if present
  let cleanedText = text
  if (cleanedText.startsWith("===")) {
    // Find the first newline after the "===" and remove everything before it
    const firstNewline = cleanedText.indexOf("\n")
    if (firstNewline !== -1) {
      cleanedText = cleanedText.substring(firstNewline + 1)
    } else {
      // If there's no newline, just remove the "==="
      cleanedText = cleanedText.replace(/^===+/, "")
    }
  }

  const separator = "==========="
  const separatorIndex = cleanedText.indexOf(separator)

  if (separatorIndex === -1) {
    // If separator not found, everything is explanation so far
    return {
      explanation: cleanedText.trim(),
      sql: "",
    }
  }

  // Split the text into explanation and SQL
  const explanation = cleanedText.substring(0, separatorIndex).trim()

  // Get the SQL part and ensure it doesn't start with "===" or similar
  let sql = cleanedText.substring(separatorIndex + separator.length).trim()

  // Remove any "===" at the beginning of the SQL
  sql = sql.replace(/^===+/, "").trim()

  return { explanation, sql }
}

/**
 * Process SSE data by properly handling the event format
 * SSE format:
 * data: line1\n
 * data: line2\n
 * \n (empty line marks end of event)
 */
function processSSEData(data: string): string {
  // For debugging
  if (process.env.NODE_ENV === "development") {
    debugLogSSE(data, "Raw SSE Data")
  }

  // Initialize result
  let result = ""

  // Split by double newlines to separate events
  const events = data.split(/\n\n+/)

  for (const event of events) {
    if (!event.trim()) continue

    // Process each line in the event
    const lines = event.split(/\n/)
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue

      // Check if line starts with "data:" and extract the content
      if (line.startsWith("data:")) {
        // Extract content after "data:" prefix, handling potential space after colon
        const content = line.substring(5).trimStart()

        // Skip lines that are just "===" markers
        if (content.trim() === "===") continue

        result += content + "\n"
      } else {
        // If it's not a data line but has content, include it anyway
        // Skip lines that are just "===" markers
        if (line.trim() === "===") continue

        result += line + "\n"
      }
    }
  }

  const processed = result.trim()

  // For debugging
  if (process.env.NODE_ENV === "development") {
    debugLogSSE(processed, "Processed SSE Data")
  }

  return processed
}

/**
 * Stream translation from natural language to SQL
 * Returns a function that can be used to subscribe to updates
 */
export async function streamTranslateToSql(
  naturalLanguageQuery: string,
  onUpdate: (data: { explanation: string; sql: string; isComplete: boolean }) => void,
): Promise<() => void> {
  // Only run in the browser
  if (typeof window === "undefined") {
    onUpdate({
      explanation: "Error: Streaming is only available in the browser",
      sql: "",
      isComplete: true,
    })
    return () => {}
  }

  let isCancelled = false
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    // Ensure we have a session
    const sessionId = await ensureSession()

    // Dynamically import the API client
    const { streamGenerateSQL } = await import("./api-client")

    // Get the stream
    const stream = await streamGenerateSQL(sessionId, naturalLanguageQuery)
    const reader = stream.getReader()

    // Process the stream
    const processStream = async () => {
      while (!isCancelled) {
        const { done, value } = await reader.read()

        if (done) {
          // Stream is complete, send final update
          const processedBuffer = processSSEData(buffer)
          const { explanation, sql } = parseStreamingResponse(processedBuffer)
          onUpdate({ explanation, sql, isComplete: true })
          break
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Process SSE data, then parse and send update
        const processedBuffer = processSSEData(buffer)
        const { explanation, sql } = parseStreamingResponse(processedBuffer)
        onUpdate({ explanation, sql, isComplete: false })
      }
    }

    // Start processing the stream
    processStream().catch((error) => {
      console.error("Error processing stream:", error)
      if (!isCancelled) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        onUpdate({
          explanation: `Error: ${errorMessage}`,
          sql: `SELECT 'API Error: ${errorMessage.replace(/'/g, "''")}' as error_message`,
          isComplete: true,
        })
      }
    })

    // Return cancel function
    return () => {
      isCancelled = true
      reader.cancel().catch(console.error)
    }
  } catch (error) {
    console.error("Error streaming translation:", error)

    // Send error as explanation
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    onUpdate({
      explanation: `Error: ${errorMessage}`,
      sql: `SELECT 'API Error: ${errorMessage.replace(/'/g, "''")}' as error_message`,
      isComplete: true,
    })

    // Return empty cancel function
    return () => {}
  }
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

    // Dynamically import the API client
    const { generateSQL } = await import("./api-client")

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
