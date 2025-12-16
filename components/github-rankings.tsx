"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { type Country, type SortField, countries } from "@/lib/countries"
import { type GitHubUser, generateMockContributions } from "@/lib/github-api"
import { CountrySelector } from "./country-selector"
import { SortTabs } from "./sort-tabs"
import { UsersTable } from "./users-table"
import { StatsHeader } from "./stats-header"
import { UserSearch } from "./user-search"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Github, RefreshCw, ChevronDown, BadgeCheck, AlertCircle } from "lucide-react"

interface SearchResponse {
  users: GitHubUser[]
  total_count: number
  isLiveData?: boolean
  message?: string
  rateLimitInfo?: {
    remaining: number
    resetAt: string | null
    isLimited: boolean
  }
}

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function GitHubRankings() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0])
  const [sortField, setSortField] = useState<SortField>("followers")
  const [page, setPage] = useState(1)
  const [showCountrySelector, setShowCountrySelector] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(
    selectedCountry ? `/api/github/users?country=${encodeURIComponent(selectedCountry.name)}&page=${page}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  )

  // Add mock contribution data and sort
  const sortedUsers = useMemo(() => {
    if (!data?.users) return []

    const usersWithContributions = data.users.map((user) =>
      user.public_contributions ? user : generateMockContributions(user),
    )

    return [...usersWithContributions].sort((a, b) => {
      switch (sortField) {
        case "followers":
          return b.followers - a.followers
        case "public_contributions":
          return (b.public_contributions || 0) - (a.public_contributions || 0)
        case "total_contributions":
          return (b.total_contributions || 0) - (a.total_contributions || 0)
        case "public_repos":
          return b.public_repos - a.public_repos
        default:
          return b.followers - a.followers
      }
    })
  }, [data?.users, sortField])

  const stats = useMemo(() => {
    if (!sortedUsers.length) return { totalFollowers: 0, totalRepos: 0 }
    return {
      totalFollowers: sortedUsers.reduce((sum, u) => sum + u.followers, 0),
      totalRepos: sortedUsers.reduce((sum, u) => sum + u.public_repos, 0),
    }
  }, [sortedUsers])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setPage(1)
    setShowCountrySelector(false)
  }

  const handleCountrySelectByName = (countryName: string) => {
    const country = countries.find((c) => c.name === countryName)
    if (country) {
      handleCountrySelect(country)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Top GitHub Users</h1>
                <p className="text-sm text-muted-foreground">By Country</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/badge">
                <Button variant="outline" size="sm">
                  <BadgeCheck className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Get Badge</span>
                  <span className="sm:hidden">Badge</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {data && data.isLiveData === false && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-500 font-medium">GitHub API Rate Limit Reached</p>
              <p className="text-muted-foreground text-sm mt-1">
                {data.message || "Showing sample data. Live data will be available when rate limit resets."}
              </p>
              {data.rateLimitInfo?.resetAt && (
                <p className="text-muted-foreground text-xs mt-1">
                  Rate limit resets at: {new Date(data.rateLimitInfo.resetAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Country Selector Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              className="w-full justify-between bg-transparent"
              onClick={() => setShowCountrySelector(!showCountrySelector)}
            >
              <span className="flex items-center gap-2">
                <span className="text-4xl">{selectedCountry.flag}</span>
                {selectedCountry.name}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCountrySelector ? "rotate-180" : ""}`} />
            </Button>

            {showCountrySelector && (
              <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                <CountrySelector selectedCountry={selectedCountry} onSelect={handleCountrySelect} />
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <UserSearch onCountrySelect={handleCountrySelectByName} />

              <div className="bg-card border border-border rounded-xl p-4">
                <CountrySelector selectedCountry={selectedCountry} onSelect={handleCountrySelect} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-6">
              <UserSearch onCountrySelect={handleCountrySelectByName} />
            </div>

            {selectedCountry && (
              <>
                {/* Country Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{selectedCountry.flag}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Top Developers in {selectedCountry.name}</h2>
                      <p className="text-muted-foreground">
                        Ranked by {sortField.replace(/_/g, " ")} • {data?.total_count?.toLocaleString() || 0} developers
                        found
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <StatsHeader
                  country={selectedCountry}
                  totalUsers={data?.total_count || 0}
                  totalFollowers={stats.totalFollowers}
                  totalRepos={stats.totalRepos}
                />

                {/* Sort Tabs */}
                <div className="mb-6">
                  <SortTabs activeSort={sortField} onSortChange={setSortField} />
                </div>

                {/* Error State */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                    <p className="text-destructive">
                      Failed to load users. GitHub API rate limit may have been exceeded.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => mutate()} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Users Table */}
                <UsersTable users={sortedUsers} sortField={sortField} loading={isLoading} />

                {/* Load More */}
                {sortedUsers.length > 0 && sortedUsers.length < (data?.total_count || 0) && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>{data?.isLiveData === false ? "Showing sample data" : "Data sourced from GitHub API"} • Updated hourly</p>
          <p className="mt-1">
            Inspired by{" "}
            <a
              href="https://github.com/gayanvoice/top-github-users"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              gayanvoice/top-github-users
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
