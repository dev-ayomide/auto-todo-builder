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
  console.log("Raw screen data:", JSON.stringify(screenData, null, 2))

  // Filter out unwanted screen captures (like code editors, dev tools, title bars, taskbars)
  const filteredData = screenData.filter((item) => {
    const appName = item.content?.app_name?.toLowerCase() || ""
    const text = item.content?.text?.toLowerCase() || ""

    // Log what we're processing
    console.log(`Processing item from app: ${appName}, text: ${text.substring(0, 100)}...`)

    // Exclude development tools, editors, and common UI elements
    const excludedApps = ["visual studio code", "chrome devtools", "cursor"]
    const excludedTextPatterns = [
      "connection error",
      "disconnected",
      "localhost:",
      "auto-todo builder", // Exclude the app's own UI
    ]

    // Skip if it's an excluded app
    if (excludedApps.some((app) => appName.includes(app))) {
      console.log(`Skipping excluded app: ${appName}`)
      return false
    }

    // Skip if no text content
    if (!text || text.trim().length < 5) {
      console.log("Skipping item with no text or very short text")
      return false
    }

    // Skip if text matches any excluded pattern
    if (excludedTextPatterns.some((pattern) => text.includes(pattern))) {
      console.log(`Skipping text with excluded pattern: ${text.substring(0, 50)}...`)
      return false
    }

    // Skip very short text (likely UI elements) - reduced from 4 to 2 words
    if (text.split(/\s+/).length < 2) {
      console.log("Skipping very short text (less than 2 words)")
      return false
    }

    // Skip title bars and taskbars based on position (if available)
    if (item.content.position) {
      const { top, height } = item.content.position
      const screenHeight = item.content.screenHeight || 1080

      // Skip top 10% (likely title bars) and bottom 10% (likely taskbars)
      // Reduced from 15% to 10% to be less aggressive
      if (top < screenHeight * 0.1 || top > screenHeight * 0.9) {
        console.log(`Skipping item based on position: top=${top}, screenHeight=${screenHeight}`)
        return false
      }
    }

    console.log("Item passed all filters")
    return true
  })

  console.log(`Filtered data: ${filteredData.length} items passed filters`)

  // If we have no filtered data, try a more lenient approach
  if (filteredData.length === 0) {
    console.log("No items passed filters, trying more lenient approach")
    return extractTodosWithLenientFilters(screenData, priorityKeywords)
  }

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

  console.log(`Grouped data by source: ${Object.keys(groupedBySource).join(", ")}`)

  let todos: Todo[] = []

  try {
    // Process each source group
    for (const [source, items] of Object.entries(groupedBySource)) {
      // Combine text from the same source
      const combinedText = items.map((item) => item.content.text).join("\n")

      // Skip if not enough text
      if (combinedText.length < 20) {
        console.log(`Skipping source ${source} - not enough text (${combinedText.length} chars)`)
        continue
      }

      console.log(`Processing source ${source} with ${combinedText.length} chars of text`)

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
          console.log(`API response for ${source}:`, result)

          if (result.success && result.data && result.data.length > 0) {
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
            console.log(`Added ${result.data.length} todos from ${source}`)
          } else {
            console.log(`No todos extracted from ${source} via API`)
            // Try fallback extraction if API returned no todos
            const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
            if (fallbackTodos.length > 0) {
              console.log(`Fallback extraction found ${fallbackTodos.length} todos from ${source}`)
              todos = [...todos, ...fallbackTodos]
            }
          }
        } else {
          console.log(`API request failed for ${source}`)
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
              console.log(`Groq extracted ${extractedTodos.length} todos from ${source}`)

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
              console.log(`Fallback extraction found ${fallbackTodos.length} todos from ${source}`)
              todos = [...todos, ...fallbackTodos]
            }
          } else {
            // If no API key is available, use fallback extraction
            console.log("No Groq API key available, using fallback extraction for source:", source)
            const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
            console.log(`Fallback extraction found ${fallbackTodos.length} todos from ${source}`)
            todos = [...todos, ...fallbackTodos]
          }
        }
      } catch (error) {
        console.error("Error processing source:", source, error)
        // If there's an error, use fallback extraction for this source
        const fallbackTodos = fallbackExtractTodos([...items], priorityKeywords)
        console.log(`Fallback extraction found ${fallbackTodos.length} todos from ${source}`)
        todos = [...todos, ...fallbackTodos]
      }
    }

    // If we still have no todos, try the fallback extraction on all filtered data
    if (todos.length === 0) {
      console.log("No todos extracted from any source, trying fallback extraction on all data")
      const fallbackTodos = fallbackExtractTodos(filteredData, priorityKeywords)
      console.log(`Fallback extraction found ${fallbackTodos.length} todos from all data`)
      todos = [...todos, ...fallbackTodos]
    }

    // Deduplicate todos based on title similarity
    const uniqueTodos = deduplicateTodos(todos)
    console.log(`Final todos count after deduplication: ${uniqueTodos.length}`)

    return uniqueTodos
  } catch (error) {
    console.error("Error extracting todos:", error)

    // Fallback to basic extraction if everything else fails
    const fallbackTodos = fallbackExtractTodos(filteredData, priorityKeywords)
    console.log(`Emergency fallback extraction found ${fallbackTodos.length} todos`)
    return deduplicateTodos(fallbackTodos)
  }
}

// More lenient extraction for when no items pass the filters
function extractTodosWithLenientFilters(
  screenData: any[],
  priorityKeywords: { high: string; medium: string; low: string },
): Promise<Todo[]> {
  console.log("Using lenient filters for extraction")

  // Apply minimal filtering
  const filteredData = screenData.filter((item) => {
    const text = item.content?.text?.toLowerCase() || ""

    // Skip if no text content
    if (!text || text.trim().length === 0) {
      return false
    }

    return true
  })

  console.log(`Lenient filtering: ${filteredData.length} items passed`)

  // Just use fallback extraction on all data
  const fallbackTodos = fallbackExtractTodos(filteredData, priorityKeywords)
  console.log(`Lenient fallback extraction found ${fallbackTodos.length} todos`)

  return Promise.resolve(deduplicateTodos(fallbackTodos))
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

  // Task detection patterns - added more patterns to catch more potential tasks
  const taskPatterns = [
    /(?:todo|to-do|task|action item):\s*(.+?)(?:\.|$)/i,
    /(?:please|pls|kindly)\s+(.+?)(?:\.|$)/i,
    /(?:need to|should|must|have to)\s+(.+?)(?:\.|$)/i,
    /(?:don't forget to|remember to)\s+(.+?)(?:\.|$)/i,
    /(?:assigned to you|your task):\s*(.+?)(?:\.|$)/i,
    /(?:can you|could you)\s+(.+?)(?:\?|\.|$)/i,
    /(?:we need|we should|we must)\s+(.+?)(?:\.|$)/i,
    /(?:let's|lets)\s+(.+?)(?:\.|$)/i,
    /(?:reminder|remind me to)\s+(.+?)(?:\.|$)/i,
    /(?:follow up on|follow-up on)\s+(.+?)(?:\.|$)/i,
    /(?:work on|complete|finish)\s+(.+?)(?:\.|$)/i,
  ]

  // Also look for sentences that might be tasks
  const sentencePatterns = [
    /I need to (.+?)(?:\.|$)/i,
    /We need to (.+?)(?:\.|$)/i,
    /You need to (.+?)(?:\.|$)/i,
    /(?:^|\n)([A-Z][^.!?]+(?:urgent|asap|today|tomorrow|soon|important)[^.!?]*)(?:\.|$)/i,
  ]

  textContent.forEach((item) => {
    if (item.type === "OCR" && item.content.text) {
      const text = item.content.text
      const textLower = text.toLowerCase()

      // Check each pattern
      for (const pattern of [...taskPatterns, ...sentencePatterns]) {
        const matches = text.match(pattern)
        if (matches && matches[1]) {
          const taskTitle = matches[1].trim()

          // Skip very short tasks
          if (taskTitle.length < 5) continue

          // Determine priority based on keywords
          let priority = "medium"
          if (highKeywords.some((keyword) => textLower.includes(keyword))) {
            priority = "high"
          } else if (lowKeywords.some((keyword) => textLower.includes(keyword))) {
            priority = "low"
          }

          // Extract potential due date
          let dueDate = null
          const dueDateMatch = textLower.match(
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
            description: text,
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

      // Also check for bullet points which often indicate tasks
      const bulletPointMatches = text.match(/(?:^|\n)[\s•\-*+]+([^\n•\-*+][^\n]+)/gm)
      if (bulletPointMatches) {
        bulletPointMatches.forEach((match) => {
          // Extract the text after the bullet
          const taskText = match.replace(/(?:^|\n)[\s•\-*+]+/, "").trim()

          // Skip very short tasks
          if (taskText.length < 5) return

          // Determine priority
          let priority = "medium"
          if (highKeywords.some((keyword) => taskText.toLowerCase().includes(keyword))) {
            priority = "high"
          } else if (lowKeywords.some((keyword) => taskText.toLowerCase().includes(keyword))) {
            priority = "low"
          }

          todos.push({
            id: uuidv4(),
            title: taskText.charAt(0).toUpperCase() + taskText.slice(1),
            description: text,
            priority,
            status: "pending",
            source: item.content.app_name || "Unknown",
            sourceUrl: item.content.browserUrl,
            createdAt: new Date().toISOString(),
            dueDate: null,
            screenshot: item.content.frame,
          })
        })
      }
    }
  })

  return todos
}

