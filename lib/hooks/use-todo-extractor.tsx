"use client"

import { useState, useEffect, useCallback } from "react"
import { pipe } from "@screenpipe/browser"
import type { Todo, Settings } from "@/lib/types"
import { extractTodosFromScreenData } from "@/lib/utils/extract-todos"
import { useScreenpipe } from "@/lib/hooks/use-screenpipe"
import { toast } from "sonner"

export function useTodoExtractor(settings: Settings | null) {
  const { isConnected, isInitialized, error: screenpipeError } = useScreenpipe()
  const [todos, setTodos] = useState<Todo[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (!loading) return // Only set timeout if we're loading

    const loadingTimeout = setTimeout(() => {
      console.log("Loading timeout reached, showing sample data")
      setLoading(false)

      // If we're still loading after 10 seconds, show sample data
      if (todos.length === 0) {
        setTodos(getSampleTodos())
        setSources(["Email", "Slack", "GitHub", "Browser"])
        setError("Loading timed out. Showing sample data. Please check your Screenpipe connection.")
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(loadingTimeout)
  }, [loading, todos.length]) // Only depend on loading state and todos.length

  const refreshTodos = useCallback(async () => {
    if (!settings) {
      // Exit loading state if settings aren't available
      setLoading(false)
      return
    }

    if (!isConnected) {
      // If not connected, show sample data and exit loading state
      setTodos(getSampleTodos())
      setSources(["Email", "Slack", "GitHub", "Browser"])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Start with a minimal query to ensure connection
      console.log("Testing Screenpipe connection...")
      await pipe.queryScreenpipe({
        contentType: "ocr",
        limit: 1,
      })

      // If that works, proceed with the full query
      console.log("Fetching screen data...")
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const results = await pipe.queryScreenpipe({
        contentType: "ocr",
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
        limit: 50, // Reduced limit for better performance
        // Add position data to help filter out title bars and taskbars
        includePosition: true,
      })

      console.log("Screen data received:", results)

      // Extract todos from the screen data
      const extractedTodos = await extractTodosFromScreenData(results.data, settings.priorityKeywords)

      console.log("Extracted todos:", extractedTodos)

      // Merge with existing todos, avoiding duplicates
      setTodos((prevTodos) => {
        // Create a map of existing todo titles for quick lookup
        const existingTitles = new Map<string, boolean>()
        prevTodos.forEach((todo) => {
          existingTitles.set(todo.title.toLowerCase().trim(), true)
        })

        // Filter out new todos that are duplicates of existing ones
        const newUniqueTodos = extractedTodos.filter((todo) => {
          const normalizedTitle = todo.title.toLowerCase().trim()
          return !existingTitles.has(normalizedTitle)
        })

        // Combine existing and new unique todos
        return [...prevTodos, ...newUniqueTodos]
      })

      // Extract unique sources - Fix this to not depend on the todos state variable
      setSources((prevSources) => {
        const newSources = extractedTodos.map((todo) => todo.source)
        return Array.from(new Set([...prevSources, ...newSources]))
      })

      setLastScanTime(now)

      // Send notification for new high priority todos if enabled
      if (settings.enableNotifications) {
        const highPriorityTodos = extractedTodos.filter((todo) => todo.priority === "high" && todo.status === "pending")

        if (highPriorityTodos.length > 0) {
          pipe.sendDesktopNotification({
            title: "High Priority Tasks",
            body: `You have ${highPriorityTodos.length} high priority tasks pending`,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching todos:", error)

      // Provide more specific error messages
      if (error.status === 500) {
        setError("Screenpipe encountered an internal error. Try restarting the Screenpipe desktop app.")
      } else if (error.message?.includes("Failed to fetch")) {
        setError("Could not connect to Screenpipe. Make sure the desktop app is running.")
      } else {
        setError("Failed to fetch todos. Please check your Screenpipe connection.")
      }

      // If we can't connect to Screenpipe, provide some sample data
      if (todos.length === 0) {
        setTodos(getSampleTodos())
        setSources(["Email", "Slack", "GitHub", "Browser"])
      }
    } finally {
      setLoading(false)
    }
  }, [settings, isConnected]) // Removed unnecessary todos dependency

  // Initial load when Screenpipe is initialized
  useEffect(() => {
    if (settings && isInitialized) {
      refreshTodos()
    } else if (isInitialized) {
      // If initialized but no settings, exit loading state
      setLoading(false)
    }
  }, [settings, isInitialized, refreshTodos])

  // Set up periodic scanning
  useEffect(() => {
    if (!settings || !settings.enableAutoDetection || !isConnected) return

    const intervalId = setInterval(
      () => {
        refreshTodos()
        toast.info(`Scanning for new tasks...`, {
          duration: 2000,
        })
      },
      settings.scanInterval * 60 * 1000,
    )

    return () => clearInterval(intervalId)
  }, [settings, isConnected, refreshTodos])

  // Update error state based on Screenpipe connection
  useEffect(() => {
    if (screenpipeError) {
      setError(screenpipeError)
      // Exit loading state if there's a connection error
      setLoading(false)
    }
  }, [screenpipeError])

  return {
    todos,
    sources,
    loading: loading && isInitialized, // Only show loading if initialized
    error,
    refreshTodos,
    lastScanTime,
    isConnected,
  }
}

// Sample todos function remains the same...
function getSampleTodos() {
  return [
    {
      id: "1",
      title: "Update project documentation",
      description: "Add installation instructions and update API reference",
      priority: "high",
      status: "pending",
      source: "GitHub",
      sourceUrl: "https://github.com/yourusername/yourproject",
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Schedule meeting with design team",
      description: "Discuss new UI components and design system",
      priority: "medium",
      status: "pending",
      source: "Slack",
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Review pull request #42",
      description: "Code review for the new authentication feature",
      priority: "high",
      status: "pending",
      source: "GitHub",
      sourceUrl: "https://github.com/yourusername/yourproject/pull/42",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Respond to client email about timeline",
      description: "They asked about the project delivery date",
      priority: "medium",
      status: "completed",
      source: "Email",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      title: "Fix navigation bug on mobile",
      description: "Menu doesn't close properly on iOS devices",
      priority: "low",
      status: "pending",
      source: "Browser",
      createdAt: new Date().toISOString(),
    },
  ]
}

