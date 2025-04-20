"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initDuckDB } from "@/lib/duckdb"

type DuckDBContextType = {
  isLoading: boolean
  isReady: boolean
  error: Error | null
  isMockMode: boolean
}

const DuckDBContext = createContext<DuckDBContextType>({
  isLoading: true,
  isReady: false,
  error: null,
  isMockMode: true, // Always true in this implementation
})

export const useDuckDB = () => useContext(DuckDBContext)

export default function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    let isMounted = true

    async function initialize() {
      try {
        setIsLoading(true)

        // Initialize mock DuckDB
        await initDuckDB()

        // Only update state if component is still mounted
        if (isMounted) {
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error("Failed to initialize mock DuckDB:", err)

        // Only update state if component is still mounted
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to initialize mock DuckDB"))
          // Even if there's an error, we'll consider it "ready"
          setIsReady(true)
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <DuckDBContext.Provider value={{ isLoading, isReady, error, isMockMode: true }}>{children}</DuckDBContext.Provider>
  )
}
