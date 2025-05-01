"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatContainer } from "@/components/chat/chat-container"
import * as React from 'react'

export default function QueryPage({ params }: { params: { sessionId: string } }) {
  const searchParams = useSearchParams()
  const { sessionId } = React.use(params)
  const datasetParam = searchParams.get("dataset") || ""
  const [initialQuery, setInitialQuery] = useState<string | null>(null)

  // Check for initial query in sessionStorage  setInitialQuery] = useState<string | null>(null)

  // Check for initial query in sessionStorage
  useEffect(() => {
    // Try to get the query from sessionStorage first
    const storedQuery = sessionStorage.getItem(`query_${sessionId}`)
    if (storedQuery) {
      setInitialQuery(storedQuery)
      // Clean up after retrieving
      sessionStorage.removeItem(`query_${sessionId}`)
      return
    }

    // If not in sessionStorage, try to get from cookies
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === `query_${sessionId}`) {
        setInitialQuery(decodeURIComponent(value))
        // No need to clean up cookies as they're handled by the server
        return
      }
    }
  }, [sessionId])

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back to home</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">MainData.id</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          <ChatContainer sessionId={sessionId} initialQuery={initialQuery} initialDataset={datasetParam} />
        </div>
      </main>

      <footer className="border-t">
        <div className="container py-4 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MainData.id - Simplifying access to Indonesian government data
        </div>
      </footer>
    </div>
  )
}
