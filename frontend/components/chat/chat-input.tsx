"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Send, Code, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChatInputProps {
  onSendMessage: (content: string, isSQL: boolean) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"natural" | "sql">("natural")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message, activeTab === "sql")
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "natural" | "sql")} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="natural" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Natural Language
            </TabsTrigger>
            <TabsTrigger value="sql" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              SQL
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">Press Ctrl+Enter to send</div>
        </div>

        <TabsContent value="natural" className="mt-0">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the data..."
              className="pr-12 min-h-[100px] resize-none bg-background border-muted-foreground/20"
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
        </TabsContent>

        <TabsContent value="sql" className="mt-0">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter SQL query..."
              className="pr-12 min-h-[100px] resize-none font-mono text-sm bg-muted/50 border-primary/20"
              disabled={disabled}
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2"
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              variant={activeTab === "sql" ? "default" : "default"}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
