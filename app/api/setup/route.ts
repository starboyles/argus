import { NextResponse } from "next/server"

export async function GET() {
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY
  const hasGeminiKey = !!process.env.GEMINI_API_KEY

  let message = ""
  let status = "ok"

  if (hasGeminiKey && hasYouTubeKey) {
    message = "Gemini 2.5 AI and YouTube API configured - Full multimodal video analysis available"
  } else if (hasGeminiKey) {
    message = "Gemini 2.5 AI configured - Enhanced video analysis available (add YOUTUBE_API_KEY for full features)"
  } else if (hasYouTubeKey) {
    message = "YouTube API configured - Add GEMINI_API_KEY for advanced AI video understanding"
    status = "partial"
  } else {
    message = "Add GEMINI_API_KEY and YOUTUBE_API_KEY environment variables for full functionality"
    status = "limited"
  }

  return NextResponse.json({
    youtubeApiConfigured: hasYouTubeKey,
    geminiApiConfigured: hasGeminiKey,
    groqApiConfigured: false, // Deprecated
    message,
    status,
    features: {
      basicAnalysis: true,
      enhancedTranscripts: hasYouTubeKey,
      aiVideoUnderstanding: hasGeminiKey,
      multimodalRAG: hasGeminiKey,
      visualFrameSearch: hasGeminiKey,
      intelligentSections: hasGeminiKey
    }
  })
}