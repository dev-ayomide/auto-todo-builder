"use client"

import { useState, useEffect } from "react"
import type { Settings } from "@/lib/types"
import { getScreenpipeAppSettings, updateScreenpipeAppSettings } from "@/lib/actions/get-screenpipe-app-settings"

const DEFAULT_SETTINGS: Settings = {
  scanInterval: 5,
  enableNotifications: true,
  enableAutoDetection: true,
  priorityKeywords: {
    high: "urgent,asap,immediately,critical",
    medium: "soon,important,needed",
    low: "whenever,low priority,eventually",
  },
  scanSources: {
    email: true,
    chat: true,
    browser: true,
    documents: true,
    code: true,
  },
  reminderTiming: {
    highPriority: 30,
    mediumPriority: 120,
    lowPriority: 360,
  },
}

export function usePipeSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Load Screenpipe app settings
      const screenpipeSettings = await getScreenpipeAppSettings()

      // Get pipe specific settings from customSettings
      const pipeSettings = {
        ...(screenpipeSettings.customSettings?.autoTodoBuilder && {
          ...screenpipeSettings.customSettings.autoTodoBuilder,
        }),
      }

      // Merge everything together
      setSettings({
        ...DEFAULT_SETTINGS,
        ...pipeSettings,
        screenpipeAppSettings: screenpipeSettings,
      })
      setError(null)
    } catch (error) {
      console.error("Failed to load settings:", error)
      setError("Failed to load settings")
      // Use default settings if we can't load from Screenpipe
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true)
      // Split settings
      const { screenpipeAppSettings, ...pipeSettings } = newSettings as any

      const mergedPipeSettings = {
        ...DEFAULT_SETTINGS,
        ...pipeSettings,
      }

      // Update Screenpipe settings if provided
      await updateScreenpipeAppSettings({
        ...screenpipeAppSettings,
        customSettings: {
          ...screenpipeAppSettings?.customSettings,
          autoTodoBuilder: pipeSettings,
        },
      })

      // Update state with everything
      setSettings({
        ...mergedPipeSettings,
        screenpipeAppSettings: screenpipeAppSettings || settings?.screenpipeAppSettings,
      })
      setError(null)
      return true
    } catch (error) {
      console.error("Failed to update settings:", error)
      setError("Failed to update settings")
      return false
    } finally {
      setLoading(false)
    }
  }

  return { settings, updateSettings, loading, error, loadSettings }
}

