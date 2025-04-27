"use client"

import { Database, Loader2 } from "lucide-react"
import { useDuckDB } from "@/components/duckdb-provider"
import { Progress } from "@/components/ui/progress"

export function DuckDBStatus() {
  const { isLoading, isReady, error, initializationProgress } = useDuckDB()

  return (
    <div className="px-4 py-2 flex items-center gap-2">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Initializing DuckDB...</span>
              <span className="text-xs text-muted-foreground">{Math.round(initializationProgress)}%</span>
            </div>
            <Progress value={initializationProgress} className="h-1" />
          </div>
        </>
      ) : isReady ? (
        <>
          <Database className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">DuckDB Ready</span>
        </>
      ) : (
        <>
          <Database className="h-4 w-4 text-destructive" />
          <div>
            <span className="text-sm text-destructive font-medium">DuckDB Error</span>
            {error && <p className="text-xs text-destructive">{error.message}</p>}
          </div>
        </>
      )}
    </div>
  )
}
