"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Github } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChatContainer } from "@/components/chat/chat-container"
import { cn } from "@/lib/utils"

export default function QueryPage() {
  const searchParams = useSearchParams()
  const naturalLanguageQuery = searchParams.get("q") || ""
  const datasetParam = searchParams.get("dataset") || ""

  return (
    <div className="flex flex-col h-screen">
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
          <nav className="flex items-center gap-4">
            <Link href="/datasets" className="text-sm font-medium hover:underline">
              Datasets
            </Link>
            <Link href="/about" className="text-sm font-medium hover:underline">
              About
            </Link>
            <Link
              href="https://github.com/azophy/maindata-id"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <Github className="h-4 w-4" />
              Star us on GitHub
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          <ChatContainer initialQuery={naturalLanguageQuery} initialDataset={datasetParam} />
        </div>
      </main>
    </div>
  )
}
