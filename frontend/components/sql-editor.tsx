"use client"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isLoading: boolean
  disabled?: boolean
}

export default function SqlEditor({ value, onChange, onRun, isLoading, disabled = false }: SqlEditorProps) {
  return (
    <div className="space-y-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter SQL query..."
        className="font-mono min-h-[150px]"
        disabled={disabled}
      />
      <Button onClick={onRun} disabled={isLoading || !value.trim() || disabled}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running...
          </>
        ) : (
          "Run Query"
        )}
      </Button>
    </div>
  )
}
