"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { testApiConnection } from "@/lib/api-client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ApiStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatus("checking")
        await testApiConnection()
        setStatus("connected")
      } catch (error) {
        console.error("API connection error:", error)
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      }
    }

    checkConnection()

    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs">
            {status === "checking" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Checking API...</span>
              </>
            )}
            {status === "connected" && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-green-500">API Connected</span>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">API Error</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {status === "checking" && <p>Checking connection to API...</p>}
          {status === "connected" && <p>Successfully connected to the MainData.id API</p>}
          {status === "error" && (
            <div>
              <p>Failed to connect to API</p>
              {errorMessage && <p className="text-xs text-muted-foreground">{errorMessage}</p>}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
