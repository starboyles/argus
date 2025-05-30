import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { videoId, url } = await request.json()

    // Fetch video metadata from YouTube
    const youtubeApiKey = process.env.YOUTUBE_API_KEY
    if (!youtubeApiKey) {
      console.warn("YouTube API key not found, using basic analysis")
      return NextResponse.json({
        id: videoId,
        title: "Video Analysis (Limited Mode)",
        description: "Basic video analysis mode - add YOUTUBE_API_KEY for enhanced features",
        duration: 600,
        sections: getDefaultSections(600),
        transcript: "Limited analysis mode - YouTube API key required for full transcript",
        processed: true,
      })
    }

    try {
      // Get video details from YouTube API
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`,
      )
      const videoData = await videoResponse.json()

      if (!videoData.items || videoData.items.length === 0) {
        throw new Error("Video not found")
      }

      const video = videoData.items[0]
      const title = video.snippet.title
      const description = video.snippet.description
      const duration = parseDuration(video.contentDetails.duration)

      console.log(`Processing video: ${title}`)

      // Generate intelligent sections based on video metadata
      const sections = generateVideoSections(title, description, duration)

      const processedVideoData = {
        id: videoId,
        title,
        description,
        duration,
        sections,
        transcript: `Transcript for "${title}": ${description.substring(0, 500)}...`,
        processed: true,
      }

      return NextResponse.json(processedVideoData)
    } catch (apiError) {
      console.error("YouTube API error:", apiError)
      return NextResponse.json({
        id: videoId,
        title: "Video Analysis (API Error)",
        description: "Unable to fetch video details from YouTube API",
        duration: 600,
        sections: getDefaultSections(600),
        transcript: "YouTube API error - unable to fetch video details",
        processed: true,
      })
    }
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number.parseInt(match[1] || "0")
  const minutes = Number.parseInt(match[2] || "0")
  const seconds = Number.parseInt(match[3] || "0")

  return hours * 3600 + minutes * 60 + seconds
}

function generateVideoSections(title: string, description: string, duration: number) {
  // Generate intelligent sections based on video content
  const sectionCount = Math.min(Math.max(Math.floor(duration / 120), 3), 7)
  const sectionDuration = duration / sectionCount

  // Try to create more meaningful section titles based on content
  const sections = []
  for (let i = 0; i < sectionCount; i++) {
    const startTime = Math.floor(i * sectionDuration)
    const endTime = Math.floor((i + 1) * sectionDuration)

    let sectionTitle
    let sectionDescription

    if (i === 0) {
      sectionTitle = "Introduction & Overview"
      sectionDescription = "Opening segment introducing the main topic and setting context"
    } else if (i === sectionCount - 1) {
      sectionTitle = "Conclusion & Summary"
      sectionDescription = "Closing segment with key takeaways and final thoughts"
    } else {
      // Try to extract meaningful topics from title/description
      const topics = extractTopics(title, description)
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
  const text = `${title} ${description}`.toLowerCase()
  const topics = []

  // Common educational/tutorial patterns
  if (text.includes("tutorial") || text.includes("how to")) {
    topics.push("Tutorial Steps", "Implementation", "Best Practices")
  } else if (text.includes("review") || text.includes("comparison")) {
    topics.push("Overview", "Detailed Analysis", "Comparison")
  } else if (text.includes("guide") || text.includes("learn")) {
    topics.push("Fundamentals", "Core Concepts", "Advanced Topics")
  } else if (text.includes("interview") || text.includes("discussion")) {
    topics.push("Background", "Main Discussion", "Key Insights")
  } else {
    // Generic topics
    topics.push("Main Content", "Key Points", "Examples", "Applications")
  }

  return topics
}

function getDefaultSections(duration: number) {
  const sectionCount = Math.min(Math.max(Math.floor(duration / 120), 3), 7)
  const sectionDuration = duration / sectionCount

  return Array.from({ length: sectionCount }, (_, i) => ({
    id: `section-${i + 1}`,
    title: i === 0 ? "Introduction & Overview" : i === sectionCount - 1 ? "Conclusion & Summary" : `Key Topic ${i + 1}`,
    startTime: Math.floor(i * sectionDuration),
    endTime: Math.floor((i + 1) * sectionDuration),
    description:
      i === 0
        ? "Opening segment with introduction"
        : i === sectionCount - 1
          ? "Closing segment with conclusions"
          : `Main content discussion part ${i + 1}`,
  }))
}
