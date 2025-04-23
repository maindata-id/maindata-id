"use client"

import { useState } from "react"
import { format } from "date-fns"
import { User, Database, AlertTriangle, ChevronDown, ChevronUp, BarChart3, TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "./chat-container"
import ResultsTable from "@/components/results-table"
import ResultsChart from "@/components/results-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export type MessageType = "user" | "system"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table")

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const hasResults = message.results && message.results.length > 0
  const hasError = !!message.error

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
            ) : (
              <p className={cn(message.isSQL ? "font-mono text-sm" : "")}>{message.content}</p>
            )}

            <div className="text-xs opacity-70 mt-1">{format(message.timestamp, "HH:mm")}</div>
          </div>

          {/* Results display */}
          {hasResults && (
            <Card className="w-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {message.datasetName && <Badge variant="outline">{message.datasetName}</Badge>}
                    Results ({message.results.length} rows)
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
                          <ResultsTable data={message.results} />
                        </div>
                      </TabsContent>
                      <TabsContent value="chart" className="p-0 mt-2">
                        <ResultsChart data={message.results} />
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

          {/* Error display */}
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
