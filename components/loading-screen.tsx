import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h2 className="mt-4 text-xl font-semibold">Loading Auto-Todo Builder</h2>
      <p className="text-sm text-muted-foreground mt-2">Connecting to Screenpipe...</p>
      <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
    </div>
  )
}

