import { NextResponse } from "next/server"

export async function GET() {
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY
  const hasGroqKey = !!process.env.GROQ_API_KEY

  return NextResponse.json({
    youtubeApiConfigured: hasYouTubeKey,
    groqApiConfigured: hasGroqKey,
    message: hasYouTubeKey
      ? "YouTube API is configured"
      : "Add YOUTUBE_API_KEY environment variable for full video analysis functionality",
  })
}
