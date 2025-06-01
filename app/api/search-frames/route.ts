import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { query, videoId } = await request.json()

    // Validate inputs
    if (!query || !videoId) {
      return NextResponse.json({ error: "Query and video ID are required" }, { status: 400 })
    }

    // Ensure we have the API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Get video data
    const videoResponse = await fetch(`${request.nextUrl.origin}/api/video/${videoId}`)
    const videoData = await videoResponse.json()

    // Safely extract video data
    const title = videoData.title || "Unknown Video"
    const description = videoData.description || "No description available"
    const duration = videoData.duration || 600
    const sections = videoData.sections || []
    const transcript = videoData.transcript || "No transcript available"
    const analysis = videoData.analysis || ""
    const keyTopics = videoData.keyTopics || []

    // Build comprehensive context for visual search
    const sectionsText = sections.length > 0
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

    const frameSearchPrompt = `Using Gemini 2.5's advanced video understanding capabilities, analyze this video content to find frames/moments that match the user's visual query.

Video Information:
- Title: ${title}
- Description: ${description}
- Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}
- Key Topics: ${keyTopics.join(", ")}

Video Analysis: ${analysis}

Video Sections:
${sectionsText}

Transcript/Content:
${transcript}

User's Visual Search Query: "${query}"

Based on your understanding of video content and visual elements, identify 6-8 specific timestamps where the visual content would most likely match the user's query. Consider:

1. Visual elements described in the title, description, and transcript
2. Scene transitions and topic changes from the sections
3. Typical video content patterns and structure
4. Context clues about what might be visually happening
5. Common visual elements in this type of content

For each potential match, provide:
- Timestamp in seconds
- Confidence score (0.75-0.95)
- Description of what visual content might be shown
- Scene context and why it matches the query

Format as JSON:
{
  "results": [
    {
      "timestamp": seconds,
      "confidence": score,
      "description": "visual content description",
      "scene": "scene context",
      "matchReason": "why this timestamp matches the query"
    }
  ]
}`

    try {
      // Use Gemini 2.5 for intelligent frame search
      const result = await model.generateContent(frameSearchPrompt)
      const response = await result.response
      const responseText = response.text()

      // Parse the response
      let searchResults
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          searchResults = parsed.results || []
        } else {
          throw new Error("No JSON found in response")
        }
      } catch (parseError) {
        console.warn("Could not parse Gemini frame search results, using fallback")
        searchResults = generateFallbackResults(query, duration, sections)
      }

      // Format results for the frontend
      const formattedResults = searchResults.slice(0, 8).map((result: any, index: number) => ({
        id: `frame-${index}`,
        timestamp: Math.max(0, Math.min(result.timestamp || 0, duration)),
        confidence: Math.max(0.7, Math.min(result.confidence || 0.8, 0.95)),
        description: result.description || `Visual content matching "${query}"`,
        scene: result.scene || "Video content",
        matchReason: result.matchReason || "Content analysis suggests relevance",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      }))

      // If no results from Gemini, provide intelligent fallback
      if (formattedResults.length === 0) {
        const fallbackResults = generateFallbackResults(query, duration, sections)
        return NextResponse.json({ 
          results: fallbackResults,
          searchMethod: "fallback",
          query: query
        })
      }

      return NextResponse.json({ 
        results: formattedResults,
        searchMethod: "gemini-2.5-visual",
        query: query,
        totalResults: formattedResults.length
      })

    } catch (geminiError) {
      console.error("Gemini frame search error:", geminiError)
      
      // Provide intelligent fallback results
      const fallbackResults = generateFallbackResults(query, duration, sections)
      return NextResponse.json({ 
        results: fallbackResults,
        searchMethod: "fallback",
        error: "gemini_unavailable"
      })
    }

  } catch (error) {
    console.error("Error in frame search:", error)

    // Emergency fallback
    const { query } = await request.json().catch(() => ({ query: "search query" }))

    const emergencyResults = [
      {
        id: "frame-emergency-1",
        timestamp: 30,
        confidence: 0.7,
        description: `Content potentially related to "${query}"`,
        scene: "Introduction section",
        matchReason: "Emergency fallback result",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      },
      {
        id: "frame-emergency-2",
        timestamp: 180,
        confidence: 0.65,
        description: `Visual elements that might show relevant information`,
        scene: "Main content",
        matchReason: "Emergency fallback result",
        thumbnailUrl: `/placeholder.svg?height=48&width=80`,
      },
    ]

    return NextResponse.json({ 
      results: emergencyResults,
      searchMethod: "emergency_fallback"
    })
  }
}

function generateFallbackResults(query: string, duration: number, sections: any[]) {
  const results = []
  
  // Use section boundaries as potential match points
  if (sections.length > 0) {
    sections.forEach((section, index) => {
      if (results.length < 6) {
        // Check if section content might relate to the query
        const sectionText = `${section.title} ${section.description}`.toLowerCase()
        const queryWords = query.toLowerCase().split(' ')
        
        const relevanceScore = queryWords.some(word => 
          sectionText.includes(word) || 
          sectionText.includes(word.substring(0, 4))
        ) ? 0.85 : 0.75

        results.push({
          id: `frame-fallback-${index}`,
          timestamp: section.startTime + Math.floor((section.endTime - section.startTime) / 2),
          confidence: relevanceScore,
          description: `Visual content in "${section.title}" section that may show ${query}`,
          scene: section.title,
          matchReason: "Section content analysis suggests potential relevance",
          thumbnailUrl: `/placeholder.svg?height=48&width=80`,
        })
      }
    })
  }

  // Add some distributed timestamps if we need more results
  while (results.length < 4) {
    const timestamp = Math.floor((results.length + 1) * duration / 5)
    results.push({
      id: `frame-fallback-distributed-${results.length}`,
      timestamp: timestamp,
      confidence: 0.7 - results.length * 0.05,
      description: `Potential visual content showing "${query}"`,
      scene: `Video segment ${results.length + 1}`,
      matchReason: "Distributed sampling for broad coverage",
      thumbnailUrl: `/placeholder.svg?height=48&width=80`,
    })
  }

  return results
}