"use client"

import { useEffect, useState } from "react"
import { TodoTable } from "@/components/todo-table"
import { TodoStats } from "@/components/todo-stats"
import { TodoFilters } from "@/components/todo-filters"
import { useTodoExtractor } from "@/lib/hooks/use-todo-extractor"
import { usePipeSettings } from "@/lib/hooks/use-pipe-settings"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import { Settings, AlertTriangle, RefreshCw, Power, HelpCircle } from "lucide-react"
import type { Todo } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TodoSources } from "@/components/todo-sources"
import { LoadingScreen } from "@/components/loading-screen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TodoDashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { settings, loading: settingsLoading } = usePipeSettings()
  const { todos, sources, loading, error, refreshTodos, isConnected } = useTodoExtractor(settings)
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([])
  const [activeFilters, setActiveFilters] = useState({
    source: "all",
    priority: "all",
    status: "all",
  })

  useEffect(() => {
    if (todos) {
      let filtered = [...todos]

      if (activeFilters.source !== "all") {
        filtered = filtered.filter((todo) => todo.source === activeFilters.source)
      }

      if (activeFilters.priority !== "all") {
        filtered = filtered.filter((todo) => todo.priority === activeFilters.priority)
      }

      if (activeFilters.status !== "all") {
        filtered = filtered.filter((todo) => todo.status === activeFilters.status)
      }

      setFilteredTodos(filtered)
    }
  }, [todos, activeFilters])

  if (settingsLoading || loading) {
    return <LoadingScreen />
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Auto-Todo Builder</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
            <Power className={`h-4 w-4 ${isConnected ? "text-green-500" : "text-red-500"}`} />
            <span className="text-sm font-medium">{isConnected ? "Connected to Screenpipe" : "Disconnected"}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button variant="outline" onClick={refreshTodos}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://github.com/mediar-ai/screenpipe#troubleshooting", "_blank")}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Troubleshooting Guide
              </Button>
            </div>
            <div className="mt-4 text-sm">
              <p className="font-medium">Common solutions:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Make sure Screenpipe is running on your machine</li>
                <li>Try restarting the Screenpipe desktop app</li>
                <li>Check if port 3030 is available and not blocked</li>
                <li>Verify screen capture permissions are enabled</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <TodoStats todos={todos} />

      <div className="mt-6 mb-4">
        <TodoFilters sources={sources} activeFilters={activeFilters} setActiveFilters={setActiveFilters} />
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todo List</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <TodoTable todos={filteredTodos} refreshTodos={refreshTodos} />
        </TabsContent>
        <TabsContent value="sources">
          <TodoSources sources={sources} />
        </TabsContent>
      </Tabs>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}

