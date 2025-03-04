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

  // Add a timeout to prevent infinite loading but don't use mock data
  useEffect(() => {
    if (!loading) return // Only set timeout if we're loading

    const loadingTimeout = setTimeout(() => {
      console.log("Loading timeout reached")
      setLoading(false)
      setError("Loading timed out. Please check your Screenpipe connection and try again.")
    }, 10000) // 10 second timeout (reduced from 15)

    return () => clearTimeout(loadingTimeout)
  }, [loading])

  // Load todos from localStorage on initial load
  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem("todos")
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos)
        if (parsedTodos.length > 0) {
          setTodos(parsedTodos)

          // Extract unique sources from stored todos
          const storedSources = parsedTodos.map((todo) => todo.source)
          setSources(Array.from(new Set(storedSources)))
        }
      }
    } catch (e) {
      console.error("Error loading todos from localStorage:", e)
    }
  }, [])

  const refreshTodos = useCallback(async () => {
    if (!settings) {
      // Exit loading state if settings aren't available
      setLoading(false)
      return
    }

    if (!isConnected) {
      // If not connected, show error and exit loading state
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
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes instead of 15

      const results = await pipe.queryScreenpipe({
        contentType: "ocr",
        startTime: thirtyMinutesAgo.toISOString(),
        endTime: now.toISOString(),
        limit: 30, // Increased from 15 to 30 for more data
        // Add position data to help filter out title bars and taskbars
        includePosition: true,
      })

      console.log("Screen data received:", results)

      // Extract todos from the screen data
      const extractedTodos = await extractTodosFromScreenData(results.data, settings.priorityKeywords)

      console.log("Extracted todos:", extractedTodos)

      // Load todos from localStorage
      let existingTodos = []
      try {
        const storedTodos = localStorage.getItem("todos")
        if (storedTodos) {
          existingTodos = JSON.parse(storedTodos)
        }
      } catch (e) {
        console.error("Error loading todos from localStorage:", e)
      }

      // Merge with existing todos, avoiding duplicates
      const updatedTodos = mergeAndDeduplicateTodos(existingTodos, extractedTodos)

      // Update state
      setTodos(updatedTodos)

      // Save to localStorage
      try {
        localStorage.setItem("todos", JSON.stringify(updatedTodos))
      } catch (e) {
        console.error("Error saving todos to localStorage:", e)
      }

      // Extract unique sources
      const allSources = updatedTodos.map((todo) => todo.source)
      setSources(Array.from(new Set(allSources)))

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

      // Show toast with number of tasks found
      if (extractedTodos.length > 0) {
        toast.success(`Found ${extractedTodos.length} new tasks`)
      } else {
        toast.info("No new tasks found")
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
    } finally {
      setLoading(false)
    }
  }, [settings, isConnected])

  // Helper function to merge and deduplicate todos
  function mergeAndDeduplicateTodos(existingTodos: Todo[], newTodos: Todo[]): Todo[] {
    // Create a map of existing todo titles for quick lookup
    const existingTitlesMap = new Map<string, Todo>()

    // Add existing todos to the map
    existingTodos.forEach((todo) => {
      existingTitlesMap.set(todo.title.toLowerCase().trim(), todo)
    })

    // Process new todos
    newTodos.forEach((newTodo) => {
      const normalizedTitle = newTodo.title.toLowerCase().trim()

      // If this todo doesn't exist yet, add it
      if (!existingTitlesMap.has(normalizedTitle)) {
        existingTitlesMap.set(normalizedTitle, newTodo)
      }
      // If it exists but the existing one is completed/cancelled and the new one is pending,
      // keep the existing status (don't revert completed tasks)
      else {
        const existingTodo = existingTitlesMap.get(normalizedTitle)!
        if (existingTodo.status === "pending") {
          // Update with new todo but keep the ID
          existingTitlesMap.set(normalizedTitle, {
            ...newTodo,
            id: existingTodo.id,
          })
        }
      }
    })

    // Convert map back to array
    return Array.from(existingTitlesMap.values())
  }

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

