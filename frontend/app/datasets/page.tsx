"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, FileText, RefreshCw, Loader2, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { startSession } from "@/lib/api-client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Dataset {
  id: string
  title: string
  description: string
  info_url?: string
  direct_source?: string
  original_source?: string
  source_at?: string
  is_cors_allowed?: boolean
  slug?: string
}

interface DatasetResponse {
  message: string
  metadata: {
    limit: number
    after: string | null
    search: string | null
  }
  data: Dataset[]
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [after, setAfter] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [limit] = useState(10)
  const [creatingSession, setCreatingSession] = useState<Record<string, boolean>>({})

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset pagination when search term changes
  useEffect(() => {
    setDatasets([])
    setAfter(null)
    setHasMore(true)
  }, [debouncedSearchTerm])

  const fetchDatasets = async (reset = false) => {
    if (isLoading && !reset) return

    setIsLoading(true)
    setError(null)

    const currentAfter = reset ? null : after

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/dataset`
      const params = new URLSearchParams()

      if (limit) params.append("limit", limit.toString())
      if (currentAfter) params.append("after", currentAfter)
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm)

      const url = `${apiUrl}${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.status} ${response.statusText}`)
      }

      const data: DatasetResponse = await response.json()

      if (reset) {
        setDatasets(data.data)
      } else {
        setDatasets((prev) => [...prev, ...data.data])
      }

      setAfter(data.data.length > 0 ? data.data[data.data.length - 1].id : null)
      setHasMore(data.data.length === limit)
    } catch (err) {
      console.error("Error loading datasets:", err)
      setError("Failed to load datasets. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets(true)
  }, [debouncedSearchTerm])

  const handleQueryDataset = async (datasetId: string, datasetTitle: string) => {
    setCreatingSession((prev) => ({ ...prev, [datasetId]: true }))

    try {
      const session = await startSession(`Dataset: ${datasetTitle}`)
      window.location.href = `/query/${session.session_id}?dataset=${datasetId}`
    } catch (error) {
      console.error("Failed to create session:", error)
      alert("Failed to create a new session. Please try again.")
    } finally {
      setCreatingSession((prev) => ({ ...prev, [datasetId]: false }))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => fetchDatasets(true)} disabled={isLoading}>
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
              <CardDescription>Browse and explore datasets from the catalog</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && datasets.length === 0 ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : datasets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No datasets found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {debouncedSearchTerm
                      ? `No datasets matching "${debouncedSearchTerm}"`
                      : "No datasets available in the catalog."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {datasets.map((dataset) => (
                    <Card key={dataset.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{dataset.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dataset.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Badge variant="outline" className="text-xs">
                            Added: {formatDate(dataset.source_at)}
                          </Badge>
                          {dataset.is_cors_allowed && (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              CORS Allowed
                            </Badge>
                          )}
                          {dataset.original_source && (
                            <Badge variant="outline" className="text-xs">
                              Source: {dataset.original_source}
                            </Badge>
                          )}
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQueryDataset(dataset.id, dataset.title)}
                                    disabled={creatingSession[dataset.id]}
                                  >
                                    {creatingSession[dataset.id] ? (
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                      <Database className="w-4 h-4 mr-1" />
                                    )}
                                    Query
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Create a new query session with this dataset</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {dataset.info_url && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={dataset.info_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="w-4 h-4 mr-1" />
                                        Info
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View dataset documentation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            {datasets.length > 0 && hasMore && (
              <CardFooter className="flex justify-center border-t p-4">
                <Button variant="outline" onClick={() => fetchDatasets()} disabled={isLoading || !hasMore}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      Load more
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
