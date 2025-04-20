import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import DuckDBProvider from "@/components/duckdb-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "MainData.id - Indonesian Government Data Explorer",
  description: "Explore Indonesian government data with natural language queries",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <DuckDBProvider>{children}</DuckDBProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
