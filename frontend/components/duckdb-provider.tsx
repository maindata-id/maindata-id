"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initDuckDB, isUsingMockData } from "@/lib/duckdb"

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
  isMockMode: false,
})

export const useDuckDB = () => useContext(DuckDBContext)

export default function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isMockMode, setIsMockMode] = useState(false)

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    let isMounted = true
    let initTimeout: NodeJS.Timeout

    async function initialize() {
      try {
        setIsLoading(true)

        // Set a timeout to prevent hanging if initialization takes too long
        const timeoutPromise = new Promise<never>((_, reject) => {
          initTimeout = setTimeout(() => {
            reject(new Error("DuckDB initialization timed out after 10 seconds"))
          }, 10000)
        })

        // Race between initialization and timeout
        await Promise.race([initDuckDB(), timeoutPromise])

        // Clear timeout if initialization succeeds
        clearTimeout(initTimeout)

        // Only update state if component is still mounted
        if (isMounted) {
          setIsReady(true)
          setError(null)
          setIsMockMode(isUsingMockData())
        }
      } catch (err) {
        console.error("Failed to initialize DuckDB:", err)

        // Only update state if component is still mounted
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to initialize DuckDB"))
          // Even if there's an error, we'll consider it "ready" so the app can fall back to mock data
          setIsReady(true)
          setIsMockMode(true)
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
      clearTimeout(initTimeout)
    }
  }, [])

  return <DuckDBContext.Provider value={{ isLoading, isReady, error, isMockMode }}>{children}</DuckDBContext.Provider>
}
