"use server"

import { pipe } from "@screenpipe/js"
import type { Settings as ScreenpipeAppSettings } from "@screenpipe/js"

export async function getScreenpipeAppSettings() {
  try {
    return await pipe.settings.getAll()
  } catch (error) {
    console.error("Failed to get Screenpipe app settings:", error)
    // Return empty settings if we can't get them
    return {} as ScreenpipeAppSettings
  }
}

export async function updateScreenpipeAppSettings(newSettings: Partial<ScreenpipeAppSettings>) {
  try {
    return await pipe.settings.update(newSettings)
  } catch (error) {
    console.error("Failed to update Screenpipe app settings:", error)
    throw new Error("Failed to update Screenpipe app settings")
  }
}

