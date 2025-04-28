"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { streamTranslateToSql } from "@/lib/llm"

interface StreamingSqlGenerationProps {
  query: string
  onComplete: (sql: string, explanation: string) => void
  onCancel: () => void
}

export function StreamingSqlGeneration({ query, onComplete, onCancel }: StreamingSqlGenerationProps) {
  const [explanation, setExplanation] = useState<string>("")
  const [sql, setSql] = useState<string>("")
  const [isComplete, setIsComplete] = useState<boolean>(false)

  useEffect(() => {
    // Start streaming
    const cancelStream = streamTranslateToSql(query, (data) => {
      setExplanation(data.explanation)
      setSql(data.sql)

      if (data.isComplete) {
        setIsComplete(true)
        onComplete(data.sql, data.explanation)
      }
    })

    // Cleanup function to cancel the stream
    return () => {
      cancelStream()
    }
  }, [query, onComplete])

  return (
    <Card className="w-full">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {!isComplete && <Loader2 className="h-4 w-4 animate-spin" />}
          Generating SQL...
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

