"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatContainer } from "@/components/chat/chat-container"
import { useDuckDB } from "@/components/duckdb-provider"

export default function QueryPage() {
  const searchParams = useSearchParams()
  const naturalLanguageQuery = searchParams.get("q") || ""
  const datasetParam = searchParams.get("dataset") || ""

  const { isLoading: isDuckDBLoading, isReady: isDuckDBReady } = useDuckDB()

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
          <ChatContainer
            initialQuery={naturalLanguageQuery}
            initialDataset={datasetParam}
            isDuckDBReady={isDuckDBReady}
            isDuckDBLoading={isDuckDBLoading}
          />
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
