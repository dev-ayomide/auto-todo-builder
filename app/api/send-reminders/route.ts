import { NextResponse } from "next/server"
import { pipe } from "@screenpipe/js"

export async function GET() {
  try {
    // Get the Screenpipe settings
    const settings = await pipe.settings.getAll()
    const autoTodoSettings = settings.customSettings?.autoTodoBuilder || {}

    // Check if notifications are enabled
    if (!autoTodoSettings.enableNotifications) {
      return NextResponse.json({
        success: true,
        message: "Notifications are disabled",
      })
    }

    // In a real implementation, we would fetch pending todos from a database
    // and send reminders based on priority and due date
    // For now, we'll just simulate this behavior

    // Simulate sending a reminder
    await pipe.sendDesktopNotification({
      title: "Todo Reminder",
      body: "Don't forget to check your pending tasks!",
    })

    return NextResponse.json({
      success: true,
      message: "Reminders sent successfully",
    })
  } catch (error) {
    console.error("Error in send-reminders cron:", error)
    return NextResponse.json({ success: false, error: "Failed to send reminders" }, { status: 500 })
  }
}

