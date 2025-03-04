import type { Settings as ScreenpipeAppSettings } from "@screenpipe/js"

export interface Todo {
  id: string
  title: string
  description?: string
  priority: "high" | "medium" | "low"
  status: "pending" | "completed" | "cancelled"
  source: string
  sourceUrl?: string
  createdAt: string
  dueDate?: string
  screenshot?: string
}

export interface Settings {
  scanInterval: number
  enableNotifications: boolean
  enableAutoDetection: boolean
  priorityKeywords: {
    high: string
    medium: string
    low: string
  }
  scanSources: {
    email: boolean
    chat: boolean
    browser: boolean
    documents: boolean
    code: boolean
  }
  reminderTiming: {
    highPriority: number
    mediumPriority: number
    lowPriority: number
  }
  screenpipeAppSettings?: ScreenpipeAppSettings
}

