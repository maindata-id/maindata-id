"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StreamingSqlGenerationProps {
  query: string
  onComplete: (sql: string, explanation: string) => void
  onCancel: () => void
}

export function StreamingSqlGeneration({ query, onComplete, onCancel }: StreamingSqlGenerationProps) {
  const [explanation, setExplanation] = useState<string>("")
  const [sql, setSql] = useState<string>("")
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to clean SQL for display
  const cleanSqlForDisplay = (sql: string): string => {
    // Remove any "===" at the beginning of the SQL
    let cleanedSql = sql.replace(/^===+\s*/, "")

    // Remove any lines that start with "===" anywhere in the SQL
    cleanedSql = cleanedSql
      .split("\n")
      .filter((line) => !line.trim().startsWith("==="))
      .join("\n")

    return cleanedSql
  }

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    let isMounted = true

    // Start streaming
    const startStreaming = async () => {
      try {
        // Dynamically import the streaming function
        const { streamTranslateToSql } = await import("@/lib/llm")

        const cancelStream = streamTranslateToSql(query, (data) => {
          if (!isMounted) return

          setExplanation(data.explanation)

          // Clean SQL before setting it for display
          const cleanedSql = cleanSqlForDisplay(data.sql)
          setSql(cleanedSql)

          if (data.isComplete) {
            setIsComplete(true)
            // Pass the cleaned SQL to the completion handler
            onComplete(cleanedSql, data.explanation)
          }
        })

        return cancelStream
      } catch (error) {
        console.error("Error starting stream:", error)
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          setError(errorMessage)
          setExplanation(`Error: ${errorMessage}`)
          setIsComplete(true)
        }
        return () => {}
      }
    }

    const cancelPromise = startStreaming()

    // Cleanup function to cancel the stream
    return () => {
      isMounted = false
      cancelPromise.then((cancel) => cancel())
    }
  }, [query, onComplete])

  return (
    <Card className="w-full">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {!isComplete && <Loader2 className="h-4 w-4 animate-spin" />}
          {error ? "Error Generating SQL" : "Generating SQL..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {explanation && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Explanation:</h3>
            <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">{explanation}</div>
          </div>
        )}

        {sql && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">SQL Query:</h3>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto font-mono">{sql}</pre>
          </div>
        )}

        {!isComplete && (
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
      </CardContent>
    </Card>
  )
}
