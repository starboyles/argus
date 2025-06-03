import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { YoutubeTranscript } from "youtube-transcript"

export async function POST(request: NextRequest) {
  try {
    const { videoId, url, extractFrames = true } = await request.json()

    // Initialize APIs
    const geminiApiKey = process.env.GEMINI_API_KEY
    const youtubeApiKey = process.env.YOUTUBE_API_KEY

    if (!geminiApiKey) {
      console.warn("Gemini API key not found, using basic analysis")
      return NextResponse.json({
        id: videoId,
        title: "Video Analysis (Limited Mode)",
        description: "Basic video analysis mode - add GEMINI_API_KEY for enhanced features",
        duration: 600,
        sections: getDefaultSections(600),
        transcript: "Limited analysis mode - Gemini API key required for advanced video understanding",
        processed: true,
      })
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    try {
      // Get video metadata
      let videoMetadata = {
        title: "Video Analysis",
        description: "Processing video with advanced multimodal analysis",
        duration: 600
      }

      if (youtubeApiKey) {
        try {
          const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`
          )
          const videoData = await videoResponse.json()

          if (videoData.items && videoData.items.length > 0) {
            const video = videoData.items[0]
            videoMetadata = {
              title: video.snippet.title,
              description: video.snippet.description,
              duration: parseDuration(video.contentDetails.duration)
            }
          }
        } catch (apiError) {
          console.warn("YouTube API error, continuing with basic metadata:", apiError)
        }
      }

      // Get transcript
      let transcript = ""
      try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId)
        transcript = transcriptData
          .map(item => `[${formatTime(item.offset / 1000)}] ${item.text}`)
          .join('\n')
      } catch (transcriptError) {
        console.warn("Could not fetch transcript:", transcriptError)
        transcript = "Transcript not available for this video"
      }

      // Extract representative frames for analysis
      let keyFrames = []
      if (extractFrames) {
        try {
          console.log("Extracting key frames for video analysis...")
          const framesResponse = await fetch(`${request.nextUrl.origin}/api/extract-frames`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              videoId, 
              query: "overview analysis", 
              maxFrames: 6 
            })
          })
          
          if (framesResponse.ok) {
            const framesData = await framesResponse.json()
            keyFrames = framesData.frames || []
            console.log(`Extracted ${keyFrames.length} key frames for analysis`)
          }
        } catch (frameError) {
          console.warn("Could not extract frames for analysis:", frameError)
        }
      }

      // Create multimodal analysis prompt
      const analysisContent = []
      
      analysisContent.push({
        text: `Perform comprehensive multimodal video analysis using both transcript and visual content.

Video Title: ${videoMetadata.title}
Video Description: ${videoMetadata.description}
Duration: ${Math.floor(videoMetadata.duration / 60)}:${(videoMetadata.duration % 60).toString().padStart(2, '0')}

Transcript:
${transcript}

${keyFrames.length > 0 ? `
VISUAL ANALYSIS:
I'm providing ${keyFrames.length} key frames from this video. Analyze these images to understand:
- Visual content and presentation style
- Code, diagrams, UI elements shown
- Tools and applications being demonstrated
- Visual teaching aids and examples
- Overall video structure and flow

MULTIMODAL ANALYSIS INSTRUCTIONS:
Combine the transcript with visual evidence to provide:
` : 'TRANSCRIPT-ONLY ANALYSIS:\n'}

1. A comprehensive analysis of the video content
2. 5-7 logical sections with timestamps, titles, and descriptions
3. Key topics and themes discussed${keyFrames.length > 0 ? ' (including visual elements)' : ''}
4. Important moments or transitions in the content
5. Technical concepts covered${keyFrames.length > 0 ? ' (both spoken and visually demonstrated)' : ''}

Format your response as JSON with this structure:
{
  "analysis": "comprehensive multimodal analysis of the video",
  "sections": [
    {
      "title": "section title",
      "startTime": seconds,
      "endTime": seconds,
      "description": "detailed description including visual and audio content"
    }
  ],
  "keyTopics": ["topic1", "topic2", ...],
  "summary": "brief summary of the entire video",
  "visualElements": ["visual element 1", "visual element 2", ...],
  "technicalConcepts": ["concept 1", "concept 2", ...]
}`
      })

      // Add key frames to analysis
      if (keyFrames.length > 0) {
        keyFrames.forEach((frame: any) => {
          analysisContent.push({
            inlineData: {
              data: frame.base64Data,
              mimeType: "image/jpeg"
            }
          })
        })
      }

      console.log(`Analyzing video with ${keyFrames.length > 0 ? 'multimodal' : 'text-only'} Gemini: ${videoMetadata.title}`)

      const result = await model.generateContent(analysisContent)
      const response = await result.response
      const analysisText = response.text()

      // Parse Gemini's response
      let geminiAnalysis
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          geminiAnalysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("No JSON found in response")
        }
      } catch (parseError) {
        console.warn("Could not parse Gemini analysis, using fallback")
        geminiAnalysis = {
          analysis: analysisText,
          sections: generateFallbackSections(videoMetadata.title, videoMetadata.description, videoMetadata.duration),
          keyTopics: extractTopicsFromText(videoMetadata.title + " " + videoMetadata.description),
          summary: "AI-generated analysis of video content",
          visualElements: keyFrames.length > 0 ? ["Visual content analyzed"] : [],
          technicalConcepts: []
        }
      }

      // Process sections
      const sections = geminiAnalysis.sections.map((section: any, index: number) => ({
        id: `section-${index + 1}`,
        title: section.title || `Section ${index + 1}`,
        startTime: Math.max(0, Math.min(section.startTime || 0, videoMetadata.duration)),
        endTime: Math.max(0, Math.min(section.endTime || videoMetadata.duration, videoMetadata.duration)),
        description: section.description || "AI-generated section description"
      }))

      const processedVideoData = {
        id: videoId,
        title: videoMetadata.title,
        description: videoMetadata.description,
        duration: videoMetadata.duration,
        sections: sections,
        transcript: transcript || `AI-enhanced analysis for "${videoMetadata.title}"`,
        analysis: geminiAnalysis.analysis,
        keyTopics: geminiAnalysis.keyTopics || [],
        summary: geminiAnalysis.summary,
        visualElements: geminiAnalysis.visualElements || [],
        technicalConcepts: geminiAnalysis.technicalConcepts || [],
        processed: true,
        aiModel: "gemini-2.0-flash-exp",
        analysisType: keyFrames.length > 0 ? "multimodal" : "text-only",
        framesAnalyzed: keyFrames.length
      }

      return NextResponse.json(processedVideoData)

    } catch (geminiError) {
      console.error("Gemini processing error:", geminiError)
      return NextResponse.json({
        id: videoId,
        title: "Video Analysis (Processing Error)",
        description: "Unable to process with Gemini AI - using fallback analysis",
        duration: 600,
        sections: getDefaultSections(600),
        transcript: "AI processing error - basic analysis provided",
        processed: true,
        error: "gemini_processing_failed"
      })
    }
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}

// Helper functions remain the same...
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = Number.parseInt(match[1] || "0")
  const minutes = Number.parseInt(match[2] || "0")
  const seconds = Number.parseInt(match[3] || "0")
  return hours * 3600 + minutes * 60 + seconds
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function generateFallbackSections(title: string, description: string, duration: number) {
  const sectionCount = Math.min(Math.max(Math.floor(duration / 120), 3), 7)
  const sectionDuration = duration / sectionCount

  return Array.from({ length: sectionCount }, (_, i) => ({
    title: i === 0 ? "Introduction & Overview" : 
           i === sectionCount - 1 ? "Conclusion & Summary" : 
           `Key Topic ${i}`,
    startTime: Math.floor(i * sectionDuration),
    endTime: Math.floor((i + 1) * sectionDuration),
    description: i === 0 ? "Opening segment with introduction" : 
                i === sectionCount - 1 ? "Closing segment with conclusions" : 
                `Main content discussion part ${i}`
  }))
}

function extractTopicsFromText(text: string): string[] {
  const lowerText = text.toLowerCase()
  const topics = []

  if (lowerText.includes("tutorial") || lowerText.includes("how to")) {
    topics.push("Tutorial", "Instructions", "Guide")
  }
  if (lowerText.includes("review")) {
    topics.push("Review", "Analysis", "Evaluation")
  }
  if (lowerText.includes("discussion") || lowerText.includes("interview")) {
    topics.push("Discussion", "Interview", "Conversation")
  }
  
  return topics.length > 0 ? topics : ["General Content", "Information", "Discussion"]
}

function getDefaultSections(duration: number) {
  return generateFallbackSections("Default Video", "Default description", duration)
}