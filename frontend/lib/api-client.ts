/**
 * API client for interacting with the MainData.id backend
 */

// Get the API base URL from environment variables or use the default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://maindata-id.fly.dev"

export interface Dataset {
  id: string
  title: string
  description: string
  url: string
  info_url: string
  source: string
  source_at: string
}

export interface QueryReference {
  id: string
  title: string
  description: string
  sql_query: string
}

export interface GenerateSQLRequest {
  session_id: string
  question: string
}

export interface GenerateSQLResponse {
  sql: string
  datasets_used: Dataset[]
  reference_queries_used: QueryReference[]
  explanation: string
  messages: any[] // This could be more strongly typed if we know the structure
}

export interface StartSessionRequest {
  title?: string
}

export interface StartSessionResponse {
  session_id: string
  created_at: string
  title: string
}

/**
 * Start a new chat session
 */
export async function startSession(title?: string): Promise<StartSessionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/start-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to start session")
    }

    return await response.json()
  } catch (error) {
    console.error("Error starting session:", error)
    throw error
  }
}

/**
 * Generate SQL from natural language
 */
export async function generateSQL(sessionId: string, question: string): Promise<GenerateSQLResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        question,
      }),
    })

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = `API error: ${response.statusText || response.status}`
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error("Error generating SQL:", error)
    throw error
  }
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to get session data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting session data:", error)
    throw error
  }
}

/**
 * Test the API connection
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("API connection test failed:", error)
    throw error
  }
}
