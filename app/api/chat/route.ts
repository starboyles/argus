import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, videoId, videoData, currentTime } = await request.json()

    // Validate input data
    if (!message || !videoId || !videoData) {
      return NextResponse.json(
        {
          error: "Missing required data",
          content: "I'm sorry, I need more information to help you with this video.",
        },
        { status: 400 },
      )
    }

    // Ensure we have the API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GROQ_API_KEY not configured",
          content: "I'm sorry, the AI service is not properly configured.",
        },
        { status: 500 },
      )
    }

    // Safely extract video data with defaults
    const title = videoData.title || "Unknown Video"
    const description = videoData.description || "No description available"
    const duration = videoData.duration || 0
    const sections = videoData.sections || []
    const transcript = videoData.transcript || "No transcript available"
    const safeCurrentTime = currentTime || 0

    // Build context from video data with safe property access
    const sectionsText =
      sections.length > 0
        ? sections
            .map((section: any) => {
              const sectionTitle = section?.title || "Untitled Section"
              const startTime = section?.startTime || 0
              const endTime = section?.endTime || 0
              const sectionDescription = section?.description || "No description"

              return `- ${sectionTitle} (${Math.floor(startTime / 60)}:${(startTime % 60).toString().padStart(2, "0")} - ${Math.floor(endTime / 60)}:${(endTime % 60).toString().padStart(2, "0")}): ${sectionDescription}`
            })
            .join("\n")
        : "No sections available"

    const videoContext = `
Video Information:
- Title: ${title}
- Description: ${description}
- Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}
- Current timestamp: ${Math.floor(safeCurrentTime / 60)}:${(safeCurrentTime % 60).toString().padStart(2, "0")}

Video Sections:
${sectionsText}

Transcript: ${transcript}
`

    const systemPrompt = `You are an AI assistant that helps users understand and analyze video content. You have access to video metadata, sections, and transcript information.

${videoContext}

Instructions:
1. Answer questions about the video content based on the provided information
2. Reference specific timestamps when relevant (format: MM:SS)
3. If asked about visual content, make reasonable inferences based on the title, description, and sections
4. Provide helpful, detailed responses that cite specific parts of the video
5. If the question cannot be answered from the available information, say so clearly

User Question: ${message}`

    // Make a direct API call to Groq with updated model
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Updated to supported model
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Groq API error:", errorData)
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const assistantResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your question."

    // Extract potential timestamp references from the response
    const timestampRegex = /(\d{1,2}):(\d{2})/g
    const citations = []
    let match

    while ((match = timestampRegex.exec(assistantResponse)) !== null) {
      const minutes = Number.parseInt(match[1])
      const seconds = Number.parseInt(match[2])
      const timestamp = minutes * 60 + seconds

      // Only add if it's within the video duration
      if (timestamp <= duration) {
        citations.push({
          text: `${match[1]}:${match[2]}`,
          startTime: timestamp,
          endTime: Math.min(timestamp + 30, duration),
        })
      }
    }

    return NextResponse.json({
      content: assistantResponse,
      citations: citations.slice(0, 3), // Limit to 3 citations
    })
  } catch (error) {
    console.error("Error in chat:", error)

    
    const errorMessage = (error instanceof Error ? error.message : "Unknown error occurred")

    return NextResponse.json(
      {
        error: "Failed to process chat message",
        content: "I'm sorry, I encountered an error while processing your message. Please try again.",
      },
      { status: 500 },
    )
  }
}
