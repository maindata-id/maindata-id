"use client"

import type React from "react"

import { useState, useImperativeHandle, forwardRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { startSession } from "@/lib/api-client"

// Define the ref type for the component
export interface NaturalLanguageInputRef {
  setAndSubmitQuery: (query: string) => void
}

const NaturalLanguageInput = forwardRef<NaturalLanguageInputRef, {}>((props, ref) => {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Create a function to handle query submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!query.trim() || isLoading) return

    setIsLoading(true)

    try {
      // Create a new session
      const session = await startSession(`Query: ${query.substring(0, 30)}${query.length > 30 ? "..." : ""}`)

      // Store the query in sessionStorage for the query page to use
      sessionStorage.setItem(`query_${session.session_id}`, query)

      // Navigate to the query page with the session ID
      router.push(`/query/${session.session_id}`)
    } catch (error) {
      console.error("Failed to create session:", error)
      alert("Failed to create a new session. Please try again.")
      setIsLoading(false)
    }
  }

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    setAndSubmitQuery: (newQuery: string) => {
      setQuery(newQuery)
      // Use setTimeout to ensure the state is updated before submitting
      setTimeout(() => {
        handleSubmit()
      }, 0)
    },
  }))

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="e.g. Jumlah penduduk DKI Jakarta tiap tahun"
          className="pr-12 py-6 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  )
})

NaturalLanguageInput.displayName = "NaturalLanguageInput"

export default NaturalLanguageInput
