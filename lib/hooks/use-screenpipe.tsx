"use client"

import { useState, useEffect } from "react"
import { pipe } from "@screenpipe/browser"

export function useScreenpipe() {
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initializeScreenpipe() {
      try {
        // First, try a simple health check
        const healthCheck = await fetch("http://localhost:3030/health")
        if (!healthCheck.ok) {
          throw new Error("Screenpipe service is not running")
        }

        // Then try a minimal query
        const testQuery = await pipe.queryScreenpipe({
          contentType: "ocr",
          limit: 1,
        })

        console.log("Screenpipe connection test:", testQuery)

        setIsConnected(true)
        setIsInitialized(true)
        setError(null)
      } catch (error) {
        console.error("Screenpipe initialization error:", error)
        setIsConnected(false)
        setIsInitialized(true) // Still mark as initialized even if there's an error
        setError(getErrorMessage(error))
      }
    }

    // Add a timeout to ensure initialization completes
    const initTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn("Screenpipe initialization timed out")
        setIsInitialized(true)
        setIsConnected(false)
        setError("Screenpipe initialization timed out. Please check if the service is running.")
      }
    }, 10000) // 10 second timeout (increased from 5 seconds)

    initializeScreenpipe()

    // Set up a periodic health check
    const intervalId = setInterval(async () => {
      try {
        await fetch("http://localhost:3030/health")
        setIsConnected(true)
        setError(null)
      } catch (error) {
        setIsConnected(false)
        setError(getErrorMessage(error))
      }
    }, 30000) // Check every 30 seconds

    return () => {
      clearInterval(intervalId)
      clearTimeout(initTimeout)
    }
  }, [isInitialized]) // Added isInitialized to dependency array

  function getErrorMessage(error: any): string {
    if (error.message?.includes("Failed to fetch")) {
      return "Could not connect to Screenpipe. Please make sure the Screenpipe desktop app is running on port 3030."
    }
    if (error.status === 500) {
      return "Screenpipe encountered an internal error. Please try restarting the Screenpipe desktop app."
    }
    if (error.status === 400) {
      return "Invalid request to Screenpipe. Please check your query parameters."
    }
    return "Unable to connect to Screenpipe. Please make sure the desktop app is running."
  }

  return {
    isConnected,
    isInitialized,
    error,
  }
}

