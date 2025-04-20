"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import SqlEditor from "@/components/sql-editor"
import ResultsTable from "@/components/results-table"
import ResultsChart from "@/components/results-chart"
import { translateToSql } from "@/lib/llm"
import { executeQuery } from "@/lib/duckdb"
import { useDuckDB } from "@/components/duckdb-provider"

export default function QueryPage() {
  const searchParams = useSearchParams()
  const naturalLanguageQuery = searchParams.get("q") || ""
  const datasetParam = searchParams.get("dataset") || ""

  const { isLoading: isDuckDBLoading, isReady: isDuckDBReady, isMockMode } = useDuckDB()
  const [isQueryLoading, setIsQueryLoading] = useState(false)
  const [sqlQuery, setSqlQuery] = useState("")
  const [dataset, setDataset] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    // Only proceed if DuckDB is ready
    if (!isDuckDBReady) return

    if (naturalLanguageQuery) {
      setIsQueryLoading(true)
      translateToSql(naturalLanguageQuery)
        .then(({ sql, datasetName }) => {
          setSqlQuery(sql)
          setDataset(datasetName)
          return executeQuery(sql)
        })
        .then((data) => {
          setResults(data)
          setError("")
        })
        .catch((err) => {
          setError(err.message)
          setResults([])
        })
        .finally(() => {
          setIsQueryLoading(false)
        })
    } else if (datasetParam) {
      // If a dataset is specified directly, create a simple query for it
      const sql = `SELECT * FROM ${datasetParam} LIMIT 100`
      setSqlQuery(sql)
      setDataset(datasetParam)

      setIsQueryLoading(true)
      executeQuery(sql)
        .then((data) => {
          setResults(data)
          setError("")
        })
        .catch((err) => {
          setError(err.message)
          setResults([])
        })
        .finally(() => {
          setIsQueryLoading(false)
        })
    }
  }, [naturalLanguageQuery, datasetParam, isDuckDBReady])

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return

    setIsQueryLoading(true)
    try {
      const data = await executeQuery(sqlQuery)
      setResults(data)
      setError("")
    } catch (err: any) {
      setError(err.message)
      setResults([])
    } finally {
      setIsQueryLoading(false)
    }
  }

  const handleDownloadCsv = () => {
    if (!results.length) return

    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join(","),
      ...results.map((row) => headers.map((header) => JSON.stringify(row[header])).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `query-results-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col min-h-screen">
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

      <main className="flex-1 py-8">
        <div className="container space-y-6">
          {naturalLanguageQuery && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="font-medium">Query: {naturalLanguageQuery}</p>
            </div>
          )}

          {isMockMode && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This application is running in demo mode with mock data. In a production environment, it would use
                DuckDB for real-time data processing.
              </AlertDescription>
            </Alert>
          )}

          {isDuckDBLoading && (
            <Card>
              <CardHeader>
                <CardTitle>Initializing...</CardTitle>
                <CardDescription>Please wait while we set up the data engine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-[150px] w-full" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          )}

          {isDuckDBReady && (
            <Card>
              <CardHeader>
                <CardTitle>Dataset: {dataset || "Not selected"}</CardTitle>
                <CardDescription>Edit the SQL query below to explore the data</CardDescription>
              </CardHeader>
              <CardContent>
                <SqlEditor
                  value={sqlQuery}
                  onChange={setSqlQuery}
                  onRun={handleRunQuery}
                  isLoading={isQueryLoading}
                  disabled={!isDuckDBReady}
                />
              </CardContent>
              {isMockMode && (
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    Using mock data. Queries are processed using predefined datasets.
                  </p>
                </CardFooter>
              )}
            </Card>
          )}

          {error ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : isQueryLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              </CardContent>
            </Card>
          ) : results.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Results</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table">
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="p-0">
                    <ResultsTable data={results} />
                  </TabsContent>
                  <TabsContent value="chart" className="p-0">
                    <ResultsChart data={results} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : null}
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
