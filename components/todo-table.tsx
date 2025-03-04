"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, MoreHorizontal, ExternalLink, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Todo } from "@/lib/types"
import { toast } from "sonner"

interface TodoTableProps {
  todos: Todo[]
  refreshTodos: () => void
}

export function TodoTable({ todos, refreshTodos }: TodoTableProps) {
  const [sortField, setSortField] = useState<keyof Todo>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [localTodos, setLocalTodos] = useState<Todo[]>(todos)

  // Update local todos when props change
  useEffect(() => {
    setLocalTodos(todos)
  }, [todos])

  const handleSort = (field: keyof Todo) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedTodos = [...localTodos].sort((a, b) => {
    if (sortField === "createdAt" || sortField === "dueDate") {
      const dateA = new Date(a[sortField] || 0).getTime()
      const dateB = new Date(b[sortField] || 0).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }

    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleStatusChange = (todo: Todo, newStatus: "pending" | "completed" | "cancelled") => {
    try {
      // Update the local state immediately for a responsive UI
      const updatedTodos = localTodos.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t))
      setLocalTodos(updatedTodos)

      // Update localStorage directly
      try {
        localStorage.setItem("todos", JSON.stringify(updatedTodos))
      } catch (e) {
        console.error("Error updating localStorage:", e)
      }

      toast.success(`Task marked as ${newStatus}`)

      // No server action call - we're using client-side storage only
    } catch (error) {
      toast.error("Failed to update task status")
      console.error(error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  if (sortedTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 rounded-lg shadow">
        <p className="text-slate-600 dark:text-slate-400 mb-4">No tasks found with the current filters</p>
        <Button onClick={refreshTodos} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("title")} className="flex items-center">
                  Task
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("priority")} className="flex items-center">
                  Priority
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("source")} className="flex items-center">
                  Source
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("createdAt")} className="flex items-center">
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("dueDate")} className="flex items-center">
                  Due
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTodos.map((todo) => (
              <TableRow key={todo.id} className={todo.status === "completed" ? "opacity-60" : ""}>
                <TableCell>
                  <Checkbox
                    checked={todo.status === "completed"}
                    onCheckedChange={(checked) => {
                      handleStatusChange(todo, checked ? "completed" : "pending")
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{todo.title}</div>
                  {todo.description && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{todo.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(todo.priority)}>
                    {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="text-sm">{todo.source}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  {todo.dueDate ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">No due date</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {todo.status !== "completed" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(todo, "completed")}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as completed
                        </DropdownMenuItem>
                      )}
                      {todo.status !== "cancelled" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(todo, "cancelled")}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel task
                        </DropdownMenuItem>
                      )}
                      {todo.status !== "pending" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(todo, "pending")}>
                          <Clock className="mr-2 h-4 w-4" />
                          Mark as pending
                        </DropdownMenuItem>
                      )}
                      {todo.sourceUrl && (
                        <DropdownMenuItem onClick={() => window.open(todo.sourceUrl, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open source
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

