import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-4">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MainData.id - Simplifying access to Indonesian open data
        </p>

        <div className="flex items-center gap-4">
          <Link href="/datasets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Datasets
          </Link>
          <Link href="/query" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Query
          </Link>
          <Link
            href="https://github.com/maindata-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  )
}

