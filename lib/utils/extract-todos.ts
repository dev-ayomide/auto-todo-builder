import type { Todo } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// Check for Groq API key
const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY

// Add a function to check string similarity
function isSimilar(str1: string, str2: string, threshold: number): boolean {
  // Simple implementation of Levenshtein distance for string similarity
  if (Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length) > 1 - threshold) {
    return false
  }

  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return true
  }

  // Count matching words
  const words1 = str1.split(/\s+/)
  const words2 = str2.split(/\s+/)

  let matchCount = 0
  for (const word of words1) {
    if (word.length > 3 && words2.includes(word)) {
      matchCount++
    }
  }

  // Calculate similarity ratio
  const similarity = matchCount / Math.max(words1.length, words2.length)
  return similarity >= threshold
}

// Add a new function to deduplicate todos based on title similarity
function deduplicateTodos(todos: Todo[]): Todo[] {
  const uniqueTodos: Todo[] = []
  const titleMap = new Map<string, boolean>()

  todos.forEach((todo) => {
    // Normalize the title for comparison
    const normalizedTitle = todo.title.toLowerCase().trim()

    // Check if we already have a similar title
    let isDuplicate = false

    // Exact match check
    if (titleMap.has(normalizedTitle)) {
      isDuplicate = true
    }

    // Similarity check (if title is 80% similar to an existing one)
    for (const [existingTitle] of titleMap.entries()) {
      if (isSimilar(normalizedTitle, existingTitle, 0.8)) {
        isDuplicate = true
        break
      }
    }

    // If not a duplicate, add it to our unique list
    if (!isDuplicate) {
      titleMap.set(normalizedTitle, true)
      uniqueTodos.push(todo)
    }
  })

  return uniqueTodos
}

// Modify the extractTodosFromScreenData function to add better filtering and deduplication
export async function extractTodosFromScreenData(
  screenData: any[],
  priorityKeywords: { high: string; medium: string; low: string },
): Promise<Todo[]> {
  // Filter out unwanted screen captures (like code editors, dev tools, title bars, taskbars)
  const filteredData = screenData.filter((item) => {
    const appName = item.content?.app_name?.toLowerCase() || ""
    // Exclude development tools and editors
    const excludedApps = ["visual studio code", "chrome devtools", "cursor", "terminal"]

    // Skip if it's an excluded app
    if (excludedApps.some((app) => appName.includes(app))) {
      return false
    }

    // Skip if no text content
    if (!item.content?.text || item.content.text.trim().length < 10) {
      return false
    }

    // Skip title bars and taskbars based on position (if available)
    if (item.content.position) {
      const { top, height } = item.content.position
      const screenHeight = item.content.screenHeight || 1080

      // Skip top 5% (likely title bars) and bottom 5% (likely taskbars)
      if (top < screenHeight * 0.05 || top > screenHeight * 0.95) {
        return false
      }
    }

    return true
  })

  // Group text by source to provide better context
  const groupedBySource: Record<string, any[]> = {}

  filteredData.forEach((item) => {
    if (item.type === "OCR" && item.content.text) {
      const source = item.content.app_name || "Unknown"
      if (!groupedBySource[source]) {
        groupedBySource[source] = []
      }
      groupedBySource[source].push(item)
    }
  })

  let todos: Todo[] = []

  try {
    // Process each source group
    for (const [source, items] of Object.entries(groupedBySource)) {
      // Combine text from the same source
      const combinedText = items.map((item) => item.content.text).join("\n")

      // Skip if not enough text
      if (combinedText.length < 20) continue

      try {
        // Try to use the server-side API route first
        const response = await fetch("/api/extract-todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: combinedText.substring(0, 2000),
            source,
            priorityKeywords,
          }),
        })

        if (response.ok) {
          const result = await response.json()

          if (result.success && result.data) {
            // Add to our todos list
            result.data.forEach((todo: any) => {
              todos.push({
                id: uuidv4(),
                title: todo.title,
                description: todo.description,
                priority: todo.priority || "medium",
                status: "pending",
                source: source,
                sourceUrl: items[0].content.browserUrl,
                createdAt: new Date().toISOString(),
                dueDate: todo.dueDate,
                screenshot: items[0].content.frame,
              })
            })
          }
        } else {
          // If server-side API fails, try client-side extraction if API key is available
          if (groqApiKey) {
            console.log("Server API failed, trying client-side extraction with Groq")
            const { text } = await generateText({
              model: groq("llama3-70b-8192"),
              prompt: `Extract potential tasks or todos from the following text. 
              Return a JSON array of objects with title, description, priority, and dueDate fields.
              For priority, use "high", "medium", or "low" based on urgency words.
              High priority keywords: ${priorityKeywords.high}
              Medium priority keywords: ${priorityKeywords.medium}
              Low priority keywords: ${priorityKeywords.low}
              If no due date is mentioned, return null for dueDate.
              Only return valid JSON, no other text.
              
              Text from ${source}:
              ${combinedText.substring(0, 2000)}`,
            })

            try {
              // Parse the JSON response
              const extractedTodos = JSON.parse(text)

              // Add to our todos list
              extractedTodos.forEach((todo: any) => {
                todos.push({
                  id: uuidv4(),
                  title: todo.title,
                  description: todo.description,
                  priority: todo.priority || "medium",
                  status: "pending",
                  source: source,
                  sourceUrl: items[0].content.browserUrl,
                  createdAt: new Date().toISOString(),
                  dueDate: todo.dueDate,
                  screenshot: items[0].content.frame,
                })
              })
            } catch (error) {
              console.error("Error parsing Groq response:", error)
              // If client-side extraction fails, use fallback extraction for this source
              const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
              todos = [...todos, ...fallbackTodos]
            }
          } else {
            // If no API key is available, use fallback extraction
            console.log("No Groq API key available, using fallback extraction for source:", source)
            const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
            todos = [...todos, ...fallbackTodos]
          }
        }
      } catch (error) {
        console.error("Error processing source:", source, error)
        // If there's an error, use fallback extraction for this source
        const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
        todos = [...todos, ...fallbackTodos]
      }
    }

    // Deduplicate todos based on title similarity
    todos = deduplicateTodos(todos)

    return todos
  } catch (error) {
    console.error("Error extracting todos with Groq:", error)

    // Fallback to basic extraction if AI fails
    return deduplicateTodos(fallbackExtractTodos(filteredData, priorityKeywords))
  }
}

// Fallback extraction method using regex patterns
function fallbackExtractTodos(
  textContent: any[],
  priorityKeywords: { high: string; medium: string; low: string },
): Todo[] {
  const todos: Todo[] = []

  // Convert priority keywords to arrays
  const highKeywords = priorityKeywords.high.split(",").map((k) => k.trim().toLowerCase())
  const mediumKeywords = priorityKeywords.medium.split(",").map((k) => k.trim().toLowerCase())
  const lowKeywords = priorityKeywords.low.split(",").map((k) => k.trim().toLowerCase())

  // Task detection patterns
  const taskPatterns = [
    /(?:todo|to-do|task|action item):\s*(.+?)(?:\.|$)/i,
    /(?:please|pls|kindly)\s+(.+?)(?:\.|$)/i,
    /(?:need to|should|must|have to)\s+(.+?)(?:\.|$)/i,
    /(?:don't forget to|remember to)\s+(.+?)(?:\.|$)/i,
    /(?:assigned to you|your task):\s*(.+?)(?:\.|$)/i,
  ]

  textContent.forEach((item) => {
    if (item.type === "OCR" && item.content.text) {
      const text = item.content.text.toLowerCase()

      // Check each pattern
      for (const pattern of taskPatterns) {
        const matches = text.match(pattern)
        if (matches && matches[1]) {
          const taskTitle = matches[1].trim()

          // Determine priority based on keywords
          let priority = "medium"
          if (highKeywords.some((keyword) => text.includes(keyword))) {
            priority = "high"
          } else if (lowKeywords.some((keyword) => text.includes(keyword))) {
            priority = "low"
          }

          // Extract potential due date
          let dueDate = null
          const dueDateMatch = text.match(
            /(?:due|by|before|deadline):\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i,
          )
          if (dueDateMatch && dueDateMatch[1]) {
            try {
              dueDate = new Date(dueDateMatch[1]).toISOString()
            } catch (e) {
              // Invalid date format, ignore
            }
          }

          todos.push({
            id: uuidv4(),
            title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
            description: item.content.text,
            priority,
            status: "pending",
            source: item.content.app_name || "Unknown",
            sourceUrl: item.content.browserUrl,
            createdAt: new Date().toISOString(),
            dueDate,
            screenshot: item.content.frame,
          })
        }
      }
    }
  })

  return todos
}
