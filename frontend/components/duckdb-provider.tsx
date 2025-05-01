"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// Remove direct import of DuckDB
// import { initDuckDB } from "@/lib/duckdb"

type DuckDBContextType = {
  isLoading: boolean
  isReady: boolean
  error: Error | null
  initializationProgress: number
}

const DuckDBContext = createContext<DuckDBContextType>({
  isLoading: true,
  isReady: false,
  error: null,
  initializationProgress: 0,
})

export const useDuckDB = () => useContext(DuckDBContext)

export default function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [initializationProgress, setInitializationProgress] = useState(0)

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    let isMounted = true
    let initTimeout: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout

    async function initialize() {
      try {
        setIsLoading(true)

        // Start progress animation
        let progress = 0
        progressInterval = setInterval(() => {
          if (progress < 90) {
            progress += Math.random() * 10
            progress = Math.min(progress, 90)
            if (isMounted) {
              setInitializationProgress(progress)
            }
          }
        }, 500)

        // Dynamically import DuckDB only on the client side
        const { initDuckDB } = await import("@/lib/duckdb")

        // Set a timeout to prevent hanging if initialization takes too long
        const timeoutPromise = new Promise<never>((_, reject) => {
          initTimeout = setTimeout(() => {
            reject(new Error("DuckDB initialization timed out after 20 seconds"))
          }, 20000)
        })

        // Race between initialization and timeout
        await Promise.race([initDuckDB(), timeoutPromise])

        // Clear timeout if initialization succeeds
        clearTimeout(initTimeout)

        // Complete progress animation
        clearInterval(progressInterval)
        if (isMounted) {
          setInitializationProgress(100)
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error("Failed to initialize DuckDB:", err)

        // Clear intervals and timeouts
        clearTimeout(initTimeout)
        clearInterval(progressInterval)

        // Only update state if component is still mounted
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to initialize DuckDB"))
          setInitializationProgress(0)
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
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <DuckDBContext.Provider
      value={{
        isLoading,
        isReady,
        error,
        initializationProgress,
      }}
    >
      {children}
    </DuckDBContext.Provider>
  )
}
