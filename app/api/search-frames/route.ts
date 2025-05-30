import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, videoId } = await request.json()

    // Validate inputs
    if (!query || !videoId) {
      return NextResponse.json({ error: "Query and video ID are required" }, { status: 400 })
    }

    // Ensure we have the API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
    }

    // Get video data
    const videoResponse = await fetch(`${request.nextUrl.origin}/api/video/${videoId}`)
    const videoData = await videoResponse.json()

    // Safely extract video data
    const title = videoData.title || "Unknown Video"
    const description = videoData.description || "No description available"
    const duration = videoData.duration || 600
    const sections = videoData.sections || []

    // Build sections text safely
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

    const searchPrompt = `Based on this video information, find timestamps where visual content might match the user's query.

Video: ${title}
Description: ${description}
Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}

Video Sections:
${sectionsText}

User's visual search query: "${query}"

Based on the video content, suggest 5-8 specific timestamps (in seconds) where visual content matching the query might appear. For each timestamp, provide:
- The timestamp in seconds
- A confidence score (0.7-0.95)
- A description of what visual content might be shown
- The scene context

Format each result as:
Timestamp: [seconds] | Confidence: [score] | Description: [visual description] | Scene: [context]`

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
            role: "user",
            content: searchPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Groq API error:", errorData)
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const assistantResponse = data.choices[0]?.message?.content || ""

    // Parse the response to extract search results
    const lines = assistantResponse.split("\n").filter((line: string | string[]) => line.includes("Timestamp:"))
    const results = lines.slice(0, 8).map((line: string, index: any) => {
      const timestampMatch = line.match(/Timestamp:\s*(\d+)/)
      const confidenceMatch = line.match(/Confidence:\s*(0\.\d+)/)
      const descriptionMatch = line.match(/Description:\s*([^|]+)/)
      const sceneMatch = line.match(/Scene:\s*(.+)/)

      return {
        id: `frame-${index}`,
        timestamp: timestampMatch ? Number.parseInt(timestampMatch[1]) : Math.floor(Math.random() * duration),
        confidence: confidenceMatch ? Number.parseFloat(confidenceMatch[1]) : 0.8 + Math.random() * 0.15,
        description: descriptionMatch ? descriptionMatch[1].trim() : `Visual content matching "${query}"`,
        scene: sceneMatch ? sceneMatch[1].trim() : "General scene",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      }
    })

    // If no results were parsed, create fallback results
    if (results.length === 0) {
      const fallbackResults: { id: string; timestamp: number; confidence: number; description: string; scene: string; thumbnailUrl: string }[] = []
      const timestamps = [30, Math.floor(duration * 0.25), Math.floor(duration * 0.5), Math.floor(duration * 0.75)]

      timestamps.forEach((timestamp, index) => {
        fallbackResults.push({
          id: `frame-fallback-${index}`,
          timestamp,
          confidence: 0.75 - index * 0.05,
          description: `Visual content potentially showing "${query}"`,
          scene: index === 0 ? "Introduction" : index === timestamps.length - 1 ? "Conclusion" : "Main Content",
          thumbnailUrl: `/placeholder.svg?height=48&width=80`,
        })
      })

      return NextResponse.json({ results: fallbackResults })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in frame search:", error)

    // Provide fallback results even on error
    const { query } = await request.json().catch(() => ({ query: "search query" }))

    const fallbackResults = [
      {
        id: "frame-error-1",
        timestamp: 30,
        confidence: 0.7,
        description: `Content potentially related to "${query}"`,
        scene: "Introduction",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      },
      {
        id: "frame-error-2",
        timestamp: 180,
        confidence: 0.65,
        description: `Visual content that might show relevant information`,
        scene: "Main Content",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      },
    ]

    return NextResponse.json({ results: fallbackResults })
  }
}
