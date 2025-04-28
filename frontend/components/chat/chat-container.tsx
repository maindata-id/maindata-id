"use client"

import { useEffect, useRef, useState } from "react"
import { ChatMessage, type MessageType } from "./chat-message"
import { ChatInput } from "./chat-input"
import { executeQuery, getTables, type QueryResult } from "@/lib/duckdb"
import { setCurrentSessionId } from "@/lib/llm"
import { DuckDBStatus } from "./duckdb-status"
import { useDuckDB } from "@/components/duckdb-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Settings } from "lucide-react"
import { getQueryDescription } from "@/lib/sql-parser"
import type { Dataset, QueryReference } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ApiSettingsDialog } from "./api-settings-dialog"
import { ApiStatus } from "./api-status"
import { StreamingSqlGeneration } from "./streaming-sql-generation"

export interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  isSQL: boolean
  queryResults?: QueryResult[]
  error?: string
  isLoading?: boolean
  sqlQuery?: string
  datasetName?: string
  explanation?: string
  datasets?: Dataset[]
  references?: QueryReference[]
  isStreaming?: boolean
}

interface ChatContainerProps {
  sessionId?: string
  initialQuery?: string | null
  initialDataset?: string
}

export function ChatContainer({ sessionId, initialQuery, initialDataset }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [tablesLoaded, setTablesLoaded] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { isReady: isDuckDBReady } = useDuckDB()

  // Set the session ID if provided
  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId)
    }
  }, [sessionId])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "system",
          content: "Welcome to MainData.id! You can create tables and query data using SQL or natural language.",
          timestamp: new Date(),
          isSQL: false,
        },
      ])
    }
  }, [messages.length])

  // Load available tables when DuckDB is ready
  useEffect(() => {
    if (isDuckDBReady && !tablesLoaded) {
      getTables()
        .then((availableTables) => {
          setTables(availableTables)
          setTablesLoaded(true)

          // Add a message about available tables
          if (availableTables.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: "no-tables",
                type: "system",
                content: "No tables found. You can create tables using SQL queries.",
                timestamp: new Date(),
                isSQL: false,
              },
            ])
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: "tables-info",
                type: "system",
                content: `Available tables: ${availableTables.join(", ")}`,
                timestamp: new Date(),
                isSQL: false,
              },
            ])
          }
        })
        .catch((error) => {
          console.error("Failed to load tables:", error)
        })
    }
  }, [isDuckDBReady, tablesLoaded])

  // Process initial query or dataset if provided
  useEffect(() => {
    if (isDuckDBReady && messages.length > 0 && !initialQueryProcessed) {
      setInitialQueryProcessed(true)

      if (initialQuery) {
        // Check if it looks like SQL (simple heuristic)
        const isSql =
          initialQuery.trim().toUpperCase().startsWith("SELECT") ||
          initialQuery.trim().toUpperCase().startsWith("CREATE") ||
          initialQuery.trim().toUpperCase().startsWith("INSERT") ||
          initialQuery.trim().toUpperCase().startsWith("UPDATE") ||
          initialQuery.trim().toUpperCase().startsWith("DELETE") ||
          initialQuery.trim().toUpperCase().startsWith("DROP") ||
          initialQuery.trim().toUpperCase().startsWith("ALTER")

        handleSendMessage(initialQuery, isSql)
      } else if (initialDataset) {
        const sql = `SELECT * FROM ${initialDataset} LIMIT 100`
        handleSendMessage(sql, true)
      }
    }
  }, [initialQuery, initialDataset, isDuckDBReady, messages.length, initialQueryProcessed])

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string, isSQL: boolean) => {
    if (!content.trim() || !isDuckDBReady) return

    // Generate unique ID for the message
    const messageId = `msg-${Date.now()}`

    // Add user message to chat
    const userMessage: Message = {
      id: messageId,
      type: "user",
      content,
      timestamp: new Date(),
      isSQL,
    }

    setMessages((prev) => [...prev, userMessage])

    if (isSQL) {
      // For SQL queries, use the existing flow
      handleSqlQuery(content)
    } else {
      // For natural language, use the streaming flow
      handleNaturalLanguageQuery(content)
    }
  }

  const handleSqlQuery = async (sql: string) => {
    // Add loading message
    const loadingMessageId = `loading-${Date.now()}`
    const loadingMessage: Message = {
      id: loadingMessageId,
      type: "system",
      content: "Processing your SQL query...",
      timestamp: new Date(),
      isSQL: true,
      isLoading: true,
    }

    setMessages((prev) => [...prev, loadingMessage])

    try {
      // Execute the SQL query directly
      const queryResults = await executeQuery(sql)

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      // Check if any DDL statements were executed
      const hasDdlStatements = queryResults.some((result) => result.isDdl)

      // If there were DDL statements, refresh the table list
      if (hasDdlStatements) {
        try {
          const updatedTables = await getTables()
          setTables(updatedTables)
        } catch (error) {
          console.error("Failed to refresh tables after DDL:", error)
        }
      }

      // Generate a summary of what happened
      let resultSummary = ""
      if (queryResults.length === 1) {
        resultSummary = getQueryDescription(queryResults[0].sql)
      } else {
        resultSummary = `Executed ${queryResults.length} SQL statements.`
      }

      // Add result message
      const resultMessage: Message = {
        id: `result-${Date.now()}`,
        type: "system",
        content: resultSummary,
        timestamp: new Date(),
        isSQL: false,
        queryResults,
      }

      setMessages((prev) => [...prev, resultMessage])
    } catch (err: any) {
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "system",
        content: "Error executing SQL query",
        timestamp: new Date(),
        isSQL: false,
        error: err.message,
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleNaturalLanguageQuery = (query: string) => {
    // Add streaming message
    const streamingMessageId = `streaming-${Date.now()}`
    const streamingMessage: Message = {
      id: streamingMessageId,
      type: "system",
      content: "Generating SQL from your question...",
      timestamp: new Date(),
      isSQL: false,
      isStreaming: true,
    }

    setMessages((prev) => [...prev, streamingMessage])

    // Function to handle completion of SQL generation
    const handleStreamingComplete = async (sql: string, explanation: string) => {
      try {
        // Execute the generated SQL
        const queryResults = await executeQuery(sql)

        // Remove streaming message
        setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId))

        // Add result message
        const resultMessage: Message = {
          id: `result-${Date.now()}`,
          type: "system",
          content: "I've translated your question to SQL and executed it.",
          timestamp: new Date(),
          isSQL: false,
          queryResults,
          sqlQuery: sql,
          explanation,
          datasetName: "Query Result", // This would ideally be extracted from the explanation
        }

        setMessages((prev) => [...prev, resultMessage])
      } catch (err: any) {
        // Remove streaming message
        setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId))

        // Add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: "system",
          content: "Error executing the generated SQL",
          timestamp: new Date(),
          isSQL: false,
          error: err.message,
          sqlQuery: sql,
          explanation,
        }

        setMessages((prev) => [...prev, errorMessage])
      }
    }

    // Function to handle cancellation
    const handleCancel = () => {
      // Remove streaming message
      setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId))

      // Add cancelled message
      const cancelledMessage: Message = {
        id: `cancelled-${Date.now()}`,
        type: "system",
        content: "SQL generation cancelled.",
        timestamp: new Date(),
        isSQL: false,
      }

      setMessages((prev) => [...prev, cancelledMessage])
    }

    // Update the streaming message with the component
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageId
          ? {
              ...msg,
              content: (
                <StreamingSqlGeneration query={query} onComplete={handleStreamingComplete} onCancel={handleCancel} />
              ) as unknown as string, // Type hack for the component
            }
          : msg,
      ),
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DuckDBStatus />
          <ApiStatus />
          {sessionId && (
            <div className="px-2 py-1 text-xs bg-muted rounded-md">Session: {sessionId.substring(0, 8)}...</div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => setIsSettingsOpen(true)}
          title="API Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isDuckDBReady && tables.length === 0 && tablesLoaded && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              No tables found in the database. You can create tables using SQL queries like:
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                CREATE TABLE example (id INTEGER, name VARCHAR, value DOUBLE);
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={!isDuckDBReady} />
      </div>

      <ApiSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
