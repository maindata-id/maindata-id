import { Sparkles } from "lucide-react"
import Link from "next/link"
import NaturalLanguageInput from "@/components/natural-language-input"
import { Button } from "@/components/ui/button"
import { startSession } from "@/lib/api-client"

// Function to create a session and return the URL
async function createExampleSession(title: string): Promise<string> {
  try {
    const session = await startSession(title)
    return `/query/${session.session_id}`
  } catch (error) {
    console.error("Failed to create example session:", error)
    return "#"
  }
}

export default function Home() {
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
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/create-session?query=Create%20a%20new%20table%20for%20population%20data">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Create a new table for population data
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/create-session?query=Show%20me%20all%20available%20tables">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Show me all available tables
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/create-session?query=CREATE%20TABLE%20population%20(year%20INTEGER%2C%20region%20VARCHAR%2C%20count%20INTEGER)">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  CREATE TABLE population (year INTEGER, region VARCHAR, count INTEGER)
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/create-session?query=INSERT%20INTO%20population%20VALUES%20(2023%2C%20'Jakarta'%2C%2010500000)">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  INSERT INTO population VALUES (2023, 'Jakarta', 10500000)
                </Link>
              </Button>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href="/datasets">View Datasets</Link>
          </Button>
        </div>
      </main>
      <footer className="border-t">
        <div className="container py-6 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MainData.id - Data exploration powered by DuckDB
        </div>
      </footer>
    </div>
  )
}
