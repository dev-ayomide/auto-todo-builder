import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from "lucide-react"
import type { Todo } from "@/lib/types"

interface TodoStatsProps {
  todos: Todo[]
}

export function TodoStats({ todos }: TodoStatsProps) {
  const totalTodos = todos.length
  const completedTodos = todos.filter((todo) => todo.status === "completed").length
  const pendingTodos = todos.filter((todo) => todo.status === "pending").length
  const highPriorityTodos = todos.filter((todo) => todo.priority === "high" && todo.status === "pending").length

  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTodos}</div>
          <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingTodos}</div>
          <p className="text-xs text-muted-foreground">
            {pendingTodos > 0 ? `${Math.round((pendingTodos / totalTodos) * 100)}% of all tasks` : "No pending tasks"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTodos}</div>
          <p className="text-xs text-muted-foreground">
            {completedTodos > 0
              ? `${Math.round((completedTodos / totalTodos) * 100)}% of all tasks`
              : "No completed tasks"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{highPriorityTodos}</div>
          <p className="text-xs text-muted-foreground">
            {highPriorityTodos > 0
              ? `${Math.round((highPriorityTodos / pendingTodos) * 100)}% of pending tasks`
              : "No high priority tasks"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

