import { Sparkles } from "lucide-react"
import Link from "next/link"
import NaturalLanguageInput from "@/components/natural-language-input"
import { Button } from "@/components/ui/button"

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
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ask a question about Indonesian government data
            </h2>
            <p className="text-muted-foreground">Explore public data with natural language queries powered by DuckDB</p>
          </div>

          <NaturalLanguageInput />

          <div className="w-full space-y-3">
            <h3 className="text-lg font-medium">Popular questions:</h3>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/query?q=Jumlah%20penduduk%20DKI%20Jakarta%20tiap%20tahun">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Jumlah penduduk DKI Jakarta tiap tahun
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/query?q=Anggaran%20pendidikan%20tertinggi%20di%20tahun%202022">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Anggaran pendidikan tertinggi di tahun 2022
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/query?q=Provinsi%20dengan%20angka%20kemiskinan%20tertinggi%20tahun%20lalu">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Provinsi dengan angka kemiskinan tertinggi tahun lalu
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                <Link href="/query?q=Rata-rata%20IPM%20di%20Sumatera%20Barat%20sejak%202010">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
                  Rata-rata IPM di Sumatera Barat sejak 2010
                </Link>
              </Button>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href="/datasets">See all datasets</Link>
          </Button>
        </div>
      </main>
      <footer className="border-t">
        <div className="container py-6 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MainData.id - Simplifying access to Indonesian government data
        </div>
      </footer>
    </div>
  )
}
