"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { testApiConnection } from "@/lib/api-client"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface ApiSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiSettingsDialog({ open, onOpenChange }: ApiSettingsDialogProps) {
  const [apiUrl, setApiUrl] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testError, setTestError] = useState<string | null>(null)

  // Load the current API URL when the dialog opens
  useEffect(() => {
    if (open) {
      const currentUrl =
        localStorage.getItem("MAINDATA_API_URL") ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://maindata-id.fly.dev"
      setApiUrl(currentUrl)
      setTestStatus("idle")
      setTestError(null)
    }
  }, [open])

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("MAINDATA_API_URL", apiUrl)

    // Update the environment variable (this will only work until page refresh)
    if (typeof window !== "undefined") {
      // @ts-ignore - Adding to process.env at runtime
      process.env.NEXT_PUBLIC_API_BASE_URL = apiUrl
    }

    onOpenChange(false)

    // Reload the page to apply the new API URL
    window.location.reload()
  }

  const handleTestConnection = async () => {
    setTestStatus("testing")
    setTestError(null)

    try {
      // Update the environment variable temporarily for testing
      if (typeof window !== "undefined") {
        // @ts-ignore - Adding to process.env at runtime
        process.env.NEXT_PUBLIC_API_BASE_URL = apiUrl
      }

      await testApiConnection()
      setTestStatus("success")
    } catch (error) {
      console.error("API test failed:", error)
      setTestStatus("error")
      setTestError(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-url" className="text-right">
              API URL
            </Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://maindata-id.fly.dev"
              className="col-span-3"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testStatus === "testing" || !apiUrl.trim()}
            >
              {testStatus === "testing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>

            {testStatus === "success" && (
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                <span>Connected</span>
              </div>
            )}

            {testStatus === "error" && (
              <div className="flex items-center text-destructive">
                <XCircle className="mr-1 h-4 w-4" />
                <span>Failed</span>
              </div>
            )}
          </div>

          {testStatus === "error" && testError && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{testError}</div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
