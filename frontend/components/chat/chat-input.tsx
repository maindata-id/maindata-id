"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Send, Code, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (content: string, isSQL: boolean) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSQL, setIsSQL] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message, isSQL)
      setMessage("")

      // Focus back on textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Toggle aria-label="Toggle SQL mode" pressed={isSQL} onPressedChange={setIsSQL}>
            {isSQL ? <Code className="h-4 w-4 mr-1" /> : <MessageSquare className="h-4 w-4 mr-1" />}
            {isSQL ? "SQL Mode" : "Natural Language"}
          </Toggle>
        </div>

        <div className="text-xs text-muted-foreground">Press Ctrl+Enter to send</div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSQL ? "Enter SQL query..." : "Ask a question about the data..."}
          className={cn("pr-12 min-h-[80px] resize-none", isSQL ? "font-mono text-sm" : "")}
          disabled={disabled}
        />
        <Button
          size="icon"
          className="absolute right-2 bottom-2"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
