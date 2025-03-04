import { NextResponse } from "next/server"
import { pipe } from "@screenpipe/js"
import { extractTodosFromScreenData } from "@/lib/utils/extract-todos"

export async function GET() {
  try {
    // Get the Screenpipe settings
    const settings = await pipe.settings.getAll()
    const autoTodoSettings = settings.customSettings?.autoTodoBuilder || {}

    // Check if auto-detection is enabled
    if (!autoTodoSettings.enableAutoDetection) {
      return NextResponse.json({
        success: true,
        message: "Auto-detection is disabled",
      })
    }

    // Get the last hour of screen data
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const results = await pipe.queryScreenpipe({
      contentType: "ocr+audio",
      startTime: oneHourAgo.toISOString(),
      endTime: now.toISOString(),
      limit: 500,
      includeFrames: true,
    })

    // Extract todos from the screen data
    const priorityKeywords = autoTodoSettings.priorityKeywords || {
      high: "urgent,asap,immediately,critical",
      medium: "soon,important,needed",
      low: "whenever,low priority,eventually",
    }

    const extractedTodos = await extractTodosFromScreenData(results.data, priorityKeywords)

    // In a real implementation, we would store these todos in a database
    // For now, we'll just return them

    // Send notification for high priority todos if enabled
    if (autoTodoSettings.enableNotifications) {
      const highPriorityTodos = extractedTodos.filter((todo) => todo.priority === "high" && todo.status === "pending")

      if (highPriorityTodos.length > 0) {
        await pipe.sendDesktopNotification({
          title: "High Priority Tasks",
          body: `Found ${highPriorityTodos.length} new high priority tasks`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      todosExtracted: extractedTodos.length,
      message: `Extracted ${extractedTodos.length} todos from screen data`,
    })
  } catch (error) {
    console.error("Error in scan-todos cron:", error)
    return NextResponse.json({ success: false, error: "Failed to scan for todos" }, { status: 500 })
  }
}

