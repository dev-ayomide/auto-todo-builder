"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// A simple method to store todos in cookies
// In a real app, this would use a database
export async function updateTodoStatus(todoId: string, status: "pending" | "completed" | "cancelled") {
  try {
    // Get existing todos from cookies
    const todosCookie = cookies().get("todos")
    const todos = todosCookie ? JSON.parse(todosCookie.value) : []

    // Find and update the todo
    const updatedTodos = todos.map((todo) => {
      if (todo.id === todoId) {
        return { ...todo, status }
      }
      return todo
    })

    // If todo wasn't found in existing todos, we need to save it
    // This can happen if the todo was just extracted and isn't in storage yet
    if (!todos.some((todo) => todo.id === todoId)) {
      // We'll try to find it in server-side session storage and update it
      console.log("Todo not found in cookies, this is likely a new todo")
    }

    // Save updated todos
    cookies().set({
      name: "todos",
      value: JSON.stringify(updatedTodos),
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    // Revalidate the path to refresh the data
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error updating todo status:", error)
    throw new Error("Failed to update todo status")
  }
}

