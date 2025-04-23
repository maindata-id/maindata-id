"use client"

import { useEffect, useRef, useState } from "react"
import { ChatMessage, type MessageType } from "./chat-message"
import { ChatInput } from "./chat-input"
import { executeQuery, isUsingMockData } from "@/lib/duckdb"
import { translateToSql } from "@/lib/llm"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resetMockDataFlag } from "@/lib/duckdb"

export interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  isSQL: boolean
  results?: any[]
  error?: string
  isLoading?: boolean
  sqlQuery?: string
  datasetName?: string
}

interface ChatContainerProps {
  initialQuery?: string
  initialDataset?: string
  isDuckDBReady: boolean
  isDuckDBLoading: boolean
}

export function ChatContainer({ initialQuery, initialDataset, isDuckDBReady, isDuckDBLoading }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isMockMode, setIsMockMode] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "system",
          content:
            "Welcome to MainData.id! Ask a question about Indonesian government data or write a SQL query to explore the datasets.",
          timestamp: new Date(),
          isSQL: false,
        },
      ])
    }
  }, [messages.length])

  // Process initial query if provided
  useEffect(() => {
    if (initialQuery && isDuckDBReady && messages.length === 1) {
      handleSendMessage(initialQuery, false)
    } else if (initialDataset && isDuckDBReady && messages.length === 1) {
      const sql = `SELECT * FROM ${initialDataset} LIMIT 100`
      handleSendMessage(sql, true)
    }
  }, [initialQuery, initialDataset, isDuckDBReady, messages.length])

  // Update mock mode status whenever it might change
  useEffect(() => {
    setIsMockMode(isUsingMockData())
  }, [isDuckDBReady])

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string, isSQL: boolean) => {
    if (!content.trim()) return

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

    // Add loading message
    const loadingMessageId = `loading-${Date.now()}`
    const loadingMessage: Message = {
      id: loadingMessageId,
      type: "system",
      content: "Processing your query...",
      timestamp: new Date(),
      isSQL: false,
      isLoading: true,
    }

    setMessages((prev) => [...prev, loadingMessage])

    try {
      let sqlQuery = content
      let datasetName = ""

      // If not SQL, translate to SQL first
      if (!isSQL) {
        const translation = await translateToSql(content)
        sqlQuery = translation.sql
        datasetName = translation.datasetName
      }

      // Execute the query
      const results = await executeQuery(sqlQuery)

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      // Add result message
      const resultMessage: Message = {
        id: `result-${Date.now()}`,
        type: "system",
        content: isSQL ? "Query executed successfully." : `I've translated your question to SQL:`,
        timestamp: new Date(),
        isSQL: false,
        results,
        sqlQuery,
        datasetName,
      }

      setMessages((prev) => [...prev, resultMessage])

      // Update mock mode status
      setIsMockMode(isUsingMockData())
    } catch (err: any) {
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "system",
        content: "Error executing query",
        timestamp: new Date(),
        isSQL: false,
        error: err.message,
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleResetMockMode = () => {
    resetMockDataFlag()
    setIsMockMode(false)

    // Add system message about reset
    const resetMessage: Message = {
      id: `reset-${Date.now()}`,
      type: "system",
      content: "Attempting to switch back to DuckDB mode. Your next query will try to use DuckDB.",
      timestamp: new Date(),
      isSQL: false,
    }

    setMessages((prev) => [...prev, resetMessage])
  }

  return (
    <div className="flex flex-col h-full">
      {isDuckDBLoading ? (
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[40px] w-3/4 mx-auto" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isMockMode && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  Demo Mode
                  <Button variant="outline" size="sm" onClick={handleResetMockMode} className="ml-2">
                    <RefreshCcw className="w-3 h-3 mr-1" />
                    Try Real DuckDB
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  Currently using mock data instead of DuckDB. SQL syntax errors will still be displayed correctly.
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
        </>
      )}
    </div>
  )
}
