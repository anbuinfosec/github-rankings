"use client"

import type { Country } from "@/lib/countries"
import { Users, GitCommit, FolderGit2, TrendingUp } from "lucide-react"

interface StatsHeaderProps {
  country: Country
  totalUsers: number
  totalFollowers: number
  totalRepos: number
}

export function StatsHeader({ country, totalUsers, totalFollowers, totalRepos }: StatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Users className="w-4 h-4" />
          Total Developers
        </div>
        <div className="text-2xl font-bold text-foreground">{totalUsers.toLocaleString()}</div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <TrendingUp className="w-4 h-4" />
          Combined Followers
        </div>
        <div className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <FolderGit2 className="w-4 h-4" />
          Public Repositories
        </div>
        <div className="text-2xl font-bold text-foreground">{totalRepos.toLocaleString()}</div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <GitCommit className="w-4 h-4" />
          Top Cities
        </div>
        <div className="text-sm font-medium text-foreground truncate">{country.cities.slice(0, 3).join(", ")}</div>
      </div>
    </div>
  )
}
