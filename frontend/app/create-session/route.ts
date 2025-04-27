import { type NextRequest, NextResponse } from "next/server"
import { startSession } from "@/lib/api-client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    // Create a new session
    const session = await startSession(`Example: ${query.substring(0, 30)}${query.length > 30 ? "..." : ""}`)

    // Store the query in a cookie for the query page to use
    const response = NextResponse.redirect(new URL(`/query/${session.session_id}`, request.url))
    response.cookies.set(`query_${session.session_id}`, query, {
      path: "/",
      maxAge: 3600, // 1 hour
      httpOnly: true,
    })

    return response
  } catch (error) {
    console.error("Failed to create session:", error)
    return NextResponse.redirect(new URL("/?error=session_creation_failed", request.url))
  }
}
