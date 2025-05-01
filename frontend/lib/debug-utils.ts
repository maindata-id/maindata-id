/**
 * Debug utilities for development
 */

/**
 * Safely log SSE data for debugging
 * This escapes special characters to make them visible in the console
 */
export function debugLogSSE(data: string, label = "SSE Data"): void {
  if (process.env.NODE_ENV !== "development") return

  // Escape special characters to make them visible
  const escaped = data.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")

  console.log(`[${label}] Length: ${data.length}`)
  console.log(`[${label}] Content: ${escaped}`)
}

/**
 * Log the structure of SSE events for debugging
 */
export function debugLogSSEStructure(data: string): void {
  if (process.env.NODE_ENV !== "development") return

  const events = data.split(/\n\n+/)
  console.log(`[SSE Structure] Found ${events.length} events`)

  events.forEach((event, index) => {
    if (!event.trim()) {
      console.log(`[SSE Event ${index}] Empty event`)
      return
    }

    const lines = event.split(/\n/)
    console.log(`[SSE Event ${index}] ${lines.length} lines:`)

    lines.forEach((line, lineIndex) => {
      const isData = line.startsWith("data:")
      const content = isData ? line.substring(5).trimStart() : line
      console.log(`  [Line ${lineIndex}] ${isData ? "DATA: " : "OTHER: "}"${content.replace(/\n/g, "\\n")}"`)
    })
  })
}
