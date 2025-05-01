"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  User,
  Database,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TableIcon,
  Check,
  X,
  Info,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "./chat-container"
import ResultsTable from "@/components/results-table"
import ResultsChart from "@/components/results-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export type MessageType = "user" | "system"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table")
  const [showExplanation, setShowExplanation] = useState(false)

  const toggleExpand = () => setIsExpanded(!isExpanded)
  const toggleExplanation = () => setShowExplanation(!showExplanation)

  const hasQueryResults = message.queryResults && message.queryResults.length > 0
  const hasError = !!message.error
  const hasMultipleQueries = hasQueryResults && message.queryResults.length > 1
  const hasExplanation = !!message.explanation
  const hasDatasets = message.datasets && message.datasets.length > 0
  const hasReferences = message.references && message.references.length > 0
  const isStreaming = message.isStreaming

  return (
    <div className={cn("flex w-full", message.type === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-3 max-w-[85%]", message.type === "user" ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
            message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {message.type === "user" ? <User className="h-4 w-4" /> : <Database className="h-4 w-4" />}
        </div>

        {/* Message content */}
        <div className={cn("flex flex-col space-y-2 w-full", message.type === "user" ? "items-end" : "items-start")}>
          {/* Message bubble */}
          <div
            className={cn(
              "rounded-lg px-4 py-2 max-w-full",
              message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              isStreaming ? "w-full" : "",
            )}
          >
            {message.isSQL && (
              <Badge variant="outline" className="mb-1">
                SQL
              </Badge>
            )}

            {message.isLoading ? (
              <div className="space-y-2">
                <p>Processing your query...</p>
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            ) : isStreaming ? (
              // For streaming messages, render the content directly (it's a React component)
              message.content
            ) : (
              <p className={cn(message.isSQL ? "font-mono text-sm" : "")}>{message.content}</p>
            )}

            {!isStreaming && <div className="text-xs opacity-70 mt-1">{format(message.timestamp, "HH:mm")}</div>}
          </div>

          {/* Explanation from LLM */}
          {hasExplanation && (
            <Collapsible open={showExplanation} onOpenChange={setShowExplanation} className="w-full border rounded-md">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-medium">Explanation</h4>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="p-4 text-sm">
                  <pre className="text-wrap bg-muted px-1.5 py-0.5 rounded">{message.explanation}</pre>

                  {/* Datasets used */}
                  {hasDatasets && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Datasets Used:</h5>
                      <ul className="space-y-2">
                        {message.datasets?.map((dataset) => (
                          <li key={dataset.id} className="border rounded p-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{dataset.title}</p>
                                <p className="text-xs text-muted-foreground">{dataset.description}</p>
                              </div>
                              {dataset.info_url && (
                                <a
                                  href={dataset.info_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs mt-1 text-muted-foreground">
                              Source: {dataset.source} ({new Date(dataset.source_at).toLocaleDateString()})
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference queries */}
                  {hasReferences && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Reference Queries:</h5>
                      <ul className="space-y-2">
                        {message.references?.map((ref) => (
                          <li key={ref.id} className="border rounded p-2">
                            <p className="font-medium">{ref.title}</p>
                            <p className="text-xs text-muted-foreground">{ref.description}</p>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">{ref.sql_query}</pre>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Results display for multiple queries */}
          {hasMultipleQueries && (
            <Card className="w-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Multiple SQL Statements ({message.queryResults.length})
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={toggleExpand} className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="py-0">
                  <Accordion
                    type="multiple"
                    className="w-full"
                    defaultValue={message.queryResults?.map((_, index) => `query-${index}`) || []}
                  >
                    {message.queryResults.map((result, index) => (
                      <AccordionItem key={index} value={`query-${index}`}>
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                              Statement {index + 1}
                            </span>
                            {result.isError ? (
                              <span className="text-destructive flex items-center gap-1">
                                <X className="h-3 w-3" /> Error
                              </span>
                            ) : (
                              <span className="text-green-500 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Success
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <pre className="font-mono text-xs bg-muted p-2 rounded overflow-x-auto">{result.sql}</pre>

                            {result.isError ? (
                              <div className="text-destructive text-sm p-2 border border-destructive/20 bg-destructive/10 rounded">
                                {result.errorMessage}
                              </div>
                            ) : result.results.length > 0 ? (
                              <div className="border rounded">
                                <Tabs defaultValue="table" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="table" className="flex items-center gap-1">
                                      <TableIcon className="h-4 w-4" />
                                      Table
                                    </TabsTrigger>
                                    <TabsTrigger value="chart" className="flex items-center gap-1">
                                      <BarChart3 className="h-4 w-4" />
                                      Chart
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="table" className="p-0 mt-2">
                                    <div className="max-h-[300px] overflow-auto">
                                      <ResultsTable data={result.results} />
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="chart" className="p-0 mt-2">
                                    <ResultsChart data={result.results} />
                                  </TabsContent>
                                </Tabs>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Statement executed successfully. No results returned.
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              )}
            </Card>
          )}

          {/* Results display for single query */}
          {hasQueryResults && !hasMultipleQueries && message.queryResults[0].results.length > 0 && (
            <Card className="w-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {message.datasetName && <Badge variant="outline">{message.datasetName}</Badge>}
                    Results ({message.queryResults[0].results.length} rows)
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={toggleExpand} className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <>
                  <CardContent className="py-0">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as "table" | "chart")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="table" className="flex items-center gap-1">
                          <TableIcon className="h-4 w-4" />
                          Table
                        </TabsTrigger>
                        <TabsTrigger value="chart" className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          Chart
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="table" className="p-0 mt-2">
                        <div className="max-h-[400px] overflow-auto">
                          <ResultsTable data={message.queryResults[0].results} />
                        </div>
                      </TabsContent>
                      <TabsContent value="chart" className="p-0 mt-2">
                        <ResultsChart data={message.queryResults[0].results} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>

                  <CardFooter className="py-3">
                    <div className="w-full">
                      {message.sqlQuery && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">SQL Query:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{message.sqlQuery}</pre>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          )}

          {/* Success message for statements that don't return results */}
          {hasQueryResults &&
            !hasMultipleQueries &&
            message.queryResults[0].results.length === 0 &&
            !message.queryResults[0].isError && (
              <Card className="w-full">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Statement executed successfully. No results returned.</p>
                  {message.sqlQuery && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">SQL Query:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{message.sqlQuery}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Error display for single query */}
          {hasQueryResults && !hasMultipleQueries && message.queryResults[0].isError && (
            <Card className="w-full border-destructive">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{message.queryResults[0].errorMessage}</p>
                {message.sqlQuery && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">SQL Query:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{message.sqlQuery}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* General error display */}
          {hasError && (
            <Card className="w-full border-destructive">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{message.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
