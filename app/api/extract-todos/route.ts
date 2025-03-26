import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, source, priorityKeywords } = await req.json();

    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.warn("NEXT_PUBLIC_GROQ_API_KEY is not set in server environment variables");

      // Use fallback extraction method
      const fallbackTodos = extractTodosWithRegex(text, priorityKeywords);

      return NextResponse.json({
        success: true,
        data: fallbackTodos,
        method: "fallback",
      });
    }

    try {
      // Use the Groq client to specify the model
      const { text: extractedText } = await generateText({
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
        ${text}`,
      });

      try {
        // Parse the JSON response
        const extractedTodos = JSON.parse(extractedText);
        return NextResponse.json({
          success: true,
          data: extractedTodos,
          method: "ai",
        });
      } catch (error) {
        console.error("Error parsing Groq response:", error);

        // Use fallback extraction if parsing fails
        const fallbackTodos = extractTodosWithRegex(text, priorityKeywords);

        return NextResponse.json({
          success: true,
          data: fallbackTodos,
          method: "fallback",
          parseError: true,
        });
      }
    } catch (error) {
      console.error("Error with Groq API:", error);

      // Use fallback extraction if Groq API fails
      const fallbackTodos = extractTodosWithRegex(text, priorityKeywords);

      return NextResponse.json({
        success: true,
        data: fallbackTodos,
        method: "fallback",
        apiError: true,
      });
    }
  } catch (error) {
    console.error("Error in extract-todos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract todos",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// Fallback extraction method using regex patterns
function extractTodosWithRegex(text: string, priorityKeywords: { high: string; medium: string; low: string }) {
  const todos = [];

  // Convert priority keywords to arrays
  const highKeywords = priorityKeywords.high.split(",").map((k) => k.trim().toLowerCase());
  const mediumKeywords = priorityKeywords.medium.split(",").map((k) => k.trim().toLowerCase());
  const lowKeywords = priorityKeywords.low.split(",").map((k) => k.trim().toLowerCase());

  // Task detection patterns
  const taskPatterns = [
    /(?:todo|to-do|task|action item):\s*(.+?)(?:\.|$)/i,
    /(?:please|pls|kindly)\s+(.+?)(?:\.|$)/i,
    /(?:need to|should|must|have to)\s+(.+?)(?:\.|$)/i,
    /(?:don't forget to|remember to)\s+(.+?)(?:\.|$)/i,
    /(?:assigned to you|your task):\s*(.+?)(?:\.|$)/i,
  ];

  const textLower = text.toLowerCase();

  // Check each pattern
  for (const pattern of taskPatterns) {
    const matches = textLower.match(pattern);
    if (matches && matches[1]) {
      const taskTitle = matches[1].trim();

      // Determine priority based on keywords
      let priority = "medium";
      if (highKeywords.some((keyword) => textLower.includes(keyword))) {
        priority = "high";
      } else if (lowKeywords.some((keyword) => textLower.includes(keyword))) {
        priority = "low";
      }

      // Extract potential due date
      let dueDate = null;
      const dueDateMatch = textLower.match(
        /(?:due|by|before|deadline):\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i,
      );
      if (dueDateMatch && dueDateMatch[1]) {
        try {
          dueDate = new Date(dueDateMatch[1]).toISOString();
        } catch (e) {
          // Invalid date format, ignore
        }
      }

      todos.push({
        title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
        description: text.substring(0, 200),
        priority,
        dueDate,
      });
    }
  }

  return todos;
}