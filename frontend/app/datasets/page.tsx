"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, FileText, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTables, getTableSchema } from "@/lib/duckdb"
import { useDuckDB } from "@/components/duckdb-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { startSession } from "@/lib/api-client"

interface TableInfo {
  name: string
  columns: { name: string; type: string }[]
}

export default function DatasetsPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { isReady } = useDuckDB()
  const [creatingSession, setCreatingSession] = useState<Record<string, boolean>>({})

  const loadTables = async () => {
    if (!isReady) return

    setIsLoading(true)
    setError(null)

    try {
      const tableNames = await getTables()

      const tableInfoPromises = tableNames.map(async (tableName) => {
        try {
          const columns = await getTableSchema(tableName)
          return { name: tableName, columns }
        } catch (err) {
          console.error(`Error loading schema for ${tableName}:`, err)
          return { name: tableName, columns: [] }
        }
      })

      const tableInfos = await Promise.all(tableInfoPromises)
      setTables(tableInfos)
    } catch (err) {
      console.error("Error loading tables:", err)
      setError("Failed to load tables. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isReady) {
      loadTables()
    }
  }, [isReady])

  const filteredTables = tables.filter((table) => table.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleQueryTable = async (tableName: string) => {
    setCreatingSession((prev) => ({ ...prev, [tableName]: true }))

    try {
      const session = await startSession(`Table: ${tableName}`)
      window.location.href = `/query/${session.session_id}?dataset=${tableName}`
    } catch (error) {
      console.error("Failed to create session:", error)
      alert("Failed to create a new session. Please try again.")
    } finally {
      setCreatingSession((prev) => ({ ...prev, [tableName]: false }))
    }
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
            <h1 className="text-2xl font-bold">Dataset Catalog</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search datasets..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={loadTables} disabled={!isReady || isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Datasets</CardTitle>
              <CardDescription>Browse and explore tables in your DuckDB instance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : tables.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No tables found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create tables using SQL queries in the query interface.
                  </p>
                  <Button className="mt-4" onClick={() => handleQueryTable("")}>
                    Go to Query Interface
                  </Button>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-8">
                  <p>No tables matching "{searchTerm}"</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTables.map((table) => (
                      <TableRow key={table.name}>
                        <TableCell>
                          <div className="font-medium">{table.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {table.columns.map((column) => (
                              <Badge key={column.name} variant="outline" className="text-xs">
                                {column.name}: {column.type}
                              </Badge>
                            ))}
                            {table.columns.length === 0 && (
                              <span className="text-xs text-muted-foreground">No columns found</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQueryTable(table.name)}
                              disabled={creatingSession[table.name]}
                            >
                              {creatingSession[table.name] ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Database className="w-4 h-4 mr-1" />
                              )}
                              Query
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Metadata
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
