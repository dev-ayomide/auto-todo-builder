"use server"

import { revalidatePath } from "next/cache"

export async function updateTodoStatus(todoId: string, status: "pending" | "completed" | "cancelled") {
  try {
    // In a real implementation, this would update the todo in a database
    // For now, we'll just revalidate the path to trigger a refresh

    // Simulate a delay for the API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Revalidate the path to refresh the data
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error updating todo status:", error)
    throw new Error("Failed to update todo status")
  }
}

