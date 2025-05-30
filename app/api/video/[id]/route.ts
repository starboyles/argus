import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // Try to fetch from YouTube API first
    const youtubeApiKey = process.env.YOUTUBE_API_KEY
    if (youtubeApiKey) {
      try {
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`,
        )
        const videoData = await videoResponse.json()

        if (videoData.items && videoData.items.length > 0) {
          const video = videoData.items[0]
          const title = video.snippet?.title || "Unknown Video"
          const description = video.snippet?.description || "No description available"
          const duration = parseDuration(video.contentDetails?.duration || "PT0S")

          // Generate sections
          const sections = generateVideoSections(title, description, duration)

          return NextResponse.json({
            id: videoId,
            title,
            description,
            duration,
            sections,
            transcript: `Transcript for "${title}": ${description.substring(0, 500)}${description.length > 500 ? "..." : ""}`,
          })
        }
      } catch (apiError) {
        console.warn("YouTube API error:", apiError)
      }
    }

    // Fallback response with safe defaults
    return NextResponse.json({
      id: videoId,
      title: "Video Analysis",
      description: "Video analysis and chat interface for YouTube content",
      duration: 600,
      sections: [
        {
          id: "1",
          title: "Introduction & Overview",
          startTime: 0,
          endTime: 120,
          description: "Opening segment with introduction and overview",
        },
        {
          id: "2",
          title: "Main Content",
          startTime: 120,
          endTime: 360,
          description: "Core content and key discussion points",
        },
        {
          id: "3",
          title: "Key Concepts",
          startTime: 360,
          endTime: 480,
          description: "Important concepts and examples",
        },
        {
          id: "4",
          title: "Conclusion",
          startTime: 480,
          endTime: 600,
          description: "Summary and closing remarks",
        },
      ],
      transcript: "Video transcript and analysis available through chat interface",
    })
  } catch (error) {
    console.error("Error fetching video data:", error)
    return NextResponse.json({ error: "Failed to fetch video data" }, { status: 500 })
  }
}

function parseDuration(duration: string): number {
  if (!duration || typeof duration !== "string") return 0

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number.parseInt(match[1] || "0")
  const minutes = Number.parseInt(match[2] || "0")
  const seconds = Number.parseInt(match[3] || "0")

  return hours * 3600 + minutes * 60 + seconds
}

function generateVideoSections(title: string, description: string, duration: number) {
  // Ensure we have valid inputs
  const safeTitle = title || "Unknown Video"
  const safeDescription = description || ""
  const safeDuration = duration || 600

  const sectionCount = Math.min(Math.max(Math.floor(safeDuration / 120), 3), 7)
  const sectionDuration = safeDuration / sectionCount

  const sections = []
  for (let i = 0; i < sectionCount; i++) {
    const startTime = Math.floor(i * sectionDuration)
    const endTime = Math.floor((i + 1) * sectionDuration)

    let sectionTitle
    let sectionDescription

    if (i === 0) {
      sectionTitle = "Introduction & Overview"
      sectionDescription = "Opening segment introducing the main topic"
    } else if (i === sectionCount - 1) {
      sectionTitle = "Conclusion & Summary"
      sectionDescription = "Closing segment with key takeaways"
    } else {
      const topics = extractTopics(safeTitle, safeDescription)
      if (topics.length > i - 1) {
        sectionTitle = topics[i - 1]
        sectionDescription = `Discussion of ${topics[i - 1].toLowerCase()}`
      } else {
        sectionTitle = `Key Topic ${i}`
        sectionDescription = `Main content discussion part ${i}`
      }
    }

    sections.push({
      id: `section-${i + 1}`,
      title: sectionTitle,
      startTime,
      endTime,
      description: sectionDescription,
    })
  }

  return sections
}

function extractTopics(title: string, description: string): string[] {
  // Safely handle potentially undefined inputs
  const safeTitle = title || ""
  const safeDescription = description || ""
  const text = `${safeTitle} ${safeDescription}`.toLowerCase()
  const topics = []

  if (text.includes("tutorial") || text.includes("how to")) {
    topics.push("Tutorial Steps", "Implementation", "Best Practices")
  } else if (text.includes("review") || text.includes("comparison")) {
    topics.push("Overview", "Detailed Analysis", "Comparison")
  } else if (text.includes("guide") || text.includes("learn")) {
    topics.push("Fundamentals", "Core Concepts", "Advanced Topics")
  } else if (text.includes("interview") || text.includes("discussion")) {
    topics.push("Background", "Main Discussion", "Key Insights")
  } else {
    topics.push("Main Content", "Key Points", "Examples", "Applications")
  }

  return topics
}
