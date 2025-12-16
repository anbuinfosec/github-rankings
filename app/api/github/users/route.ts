import { type NextRequest, NextResponse } from "next/server"
import {
  searchUsersByLocation,
  getMultipleUserDetails,
  generateMockContributions,
  getRateLimitInfo,
} from "@/lib/github-api"
import { getSampleDataForCountry } from "@/lib/sample-data"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get("country")
  const page = Number.parseInt(searchParams.get("page") || "1")

  if (!country) {
    return NextResponse.json({ error: "Country is required" }, { status: 400 })
  }

  try {
    // Search for users by location
    const searchResults = await searchUsersByLocation(country, page, 30)

    // Get detailed info for each user
    const usernames = searchResults.items.map((user) => user.login)
    const detailedUsers = await getMultipleUserDetails(usernames)

    // Add mock contributions
    const usersWithContributions = detailedUsers.map(generateMockContributions)

    return NextResponse.json({
      users: usersWithContributions,
      total_count: searchResults.total_count,
      page,
      rateLimitInfo: getRateLimitInfo(),
      isLiveData: true,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      const sampleUsers = getSampleDataForCountry(country)
      return NextResponse.json({
        users: sampleUsers,
        total_count: sampleUsers.length,
        page: 1,
        rateLimitInfo: getRateLimitInfo(),
        isLiveData: false,
        message: "GitHub API rate limit reached. Showing sample data. Try again in an hour.",
      })
    }

    console.error("GitHub API error:", error)
    return NextResponse.json({ error: "Failed to fetch users from GitHub" }, { status: 500 })
  }
}
