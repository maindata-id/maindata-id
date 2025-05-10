import Link from "next/link"
import { Github } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-4">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} - 
          <Link href="https://github.com/azophy" target="_blank" className="ml-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Abdurrahman Shofy Adianto
          </Link>
        </p>

        <div className="flex items-center gap-4">
          <Link href="/datasets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Datasets
          </Link>
          <Link href="/query" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Query
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
        </div>
      </div>
    </footer>
  )
}

