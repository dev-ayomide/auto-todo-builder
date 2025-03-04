import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, Code, FileText, Globe } from "lucide-react"

interface TodoSourcesProps {
  sources: string[]
}

export function TodoSources({ sources }: TodoSourcesProps) {
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "email":
      case "gmail":
      case "outlook":
        return <Mail className="h-5 w-5" />
      case "slack":
      case "discord":
      case "teams":
      case "chat":
        return <MessageSquare className="h-5 w-5" />
      case "github":
      case "gitlab":
      case "jira":
      case "code":
        return <Code className="h-5 w-5" />
      case "document":
      case "word":
      case "docs":
        return <FileText className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  const getSourceDescription = (source: string) => {
    switch (source.toLowerCase()) {
      case "email":
      case "gmail":
      case "outlook":
        return "Tasks extracted from email messages and subjects"
      case "slack":
      case "discord":
      case "teams":
      case "chat":
        return "Tasks identified in chat conversations and direct messages"
      case "github":
      case "gitlab":
      case "jira":
      case "code":
        return "Tasks from code comments, issues, and pull requests"
      case "document":
      case "word":
      case "docs":
        return "Tasks found in document content and comments"
      default:
        return "Tasks captured from various applications"
    }
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 rounded-lg shadow">
        <p className="text-slate-600 dark:text-slate-400">No data sources detected yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sources.map((source) => (
        <Card key={source}>
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">{getSourceIcon(source)}</div>
            <div>
              <CardTitle className="text-lg">{source}</CardTitle>
              <CardDescription className="text-xs">{getSourceDescription(source)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Auto-detection</Badge>
              <Badge variant="outline">Context-aware</Badge>
              <Badge variant="outline">Real-time</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

