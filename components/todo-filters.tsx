"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from "lucide-react"

interface TodoFiltersProps {
  sources: string[]
  activeFilters: {
    source: string
    priority: string
    status: string
  }
  setActiveFilters: (filters: {
    source: string
    priority: string
    status: string
  }) => void
}

export function TodoFilters({ sources, activeFilters, setActiveFilters }: TodoFiltersProps) {
  const handleReset = () => {
    setActiveFilters({
      source: "all",
      priority: "all",
      status: "all",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        <div className="space-y-1">
          <label className="text-sm font-medium">Source</label>
          <Select
            value={activeFilters.source}
            onValueChange={(value) => setActiveFilters({ ...activeFilters, source: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={activeFilters.priority}
            onValueChange={(value) => setActiveFilters({ ...activeFilters, priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={activeFilters.status}
            onValueChange={(value) => setActiveFilters({ ...activeFilters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end">
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  )
}

