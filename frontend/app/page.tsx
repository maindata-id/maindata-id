"use client"

import type React from "react"

import { useRef } from "react"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import NaturalLanguageInput, { type NaturalLanguageInputRef } from "@/components/natural-language-input"
import { Button } from "@/components/ui/button"

const exampleQueries = [
  "apa 3 kota dengan jumlah sapi perah terbanyak di jawa barat?",
  "jenis kawasan manakah yang paling banyak di antara semua kawasan hutan konservasi (darat) yang ad di jawa barat?",
  "berapa jumlah desa di jawa barat yang sungainya terkena limbah?",
  "apa fitur yang paling banyak diakses di Website Pusat Informasi dan Koordinasi COVID-19 Jawa Barat (PIKOBAR)?",
]

export default function Home() {
  // Create a ref to the NaturalLanguageInput component
  const inputRef = useRef<NaturalLanguageInputRef>(null)

  // Function to handle example query clicks
  const handleExampleClick = (query: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (inputRef.current) {
      inputRef.current.setAndSubmitQuery(query)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">MainData.id</h1>
          <nav className="flex items-center gap-4">
            <Link href="/datasets" className="text-sm font-medium hover:underline">
              Datasets
            </Link>
            <Link href="/about" className="text-sm font-medium hover:underline">
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex flex-col items-center justify-center max-w-3xl py-20 space-y-10">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore and analyze data with DuckDB</h2>
            <p className="text-muted-foreground">Use natural language or SQL to query your data</p>
          </div>

          <NaturalLanguageInput />

          <div className="w-full space-y-3">
            <h3 className="text-lg font-medium">Example queries:</h3>
            <div className="grid gap-2">
              {exampleQueries.map((query) => (
                <Button
                  key={query}
                  variant="outline"
                  className="justify-start h-auto py-3 text-left"
                  onClick={handleExampleClick(query)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  {query}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href="/datasets">View Datasets</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
