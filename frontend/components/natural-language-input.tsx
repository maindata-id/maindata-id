"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NaturalLanguageInput() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/query?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="e.g. Jumlah penduduk DKI Jakarta tiap tahun"
          className="pr-12 py-6 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          disabled={!query.trim()}
        >
          <Search className="w-5 h-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  )
}
