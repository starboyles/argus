import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { writeFile, readFile, unlink, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { videoId, query, contextTime = 0, maxFrames = 8 } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID required" }, { status: 400 })
    }

    // Create temp directory for frame processing
    const tempDir = path.join(process.cwd(), 'temp', videoId)
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    try {
      // Get video URL from YouTube
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      
      // Extract frames using yt-dlp + ffmpeg
      const frameResults = await extractVideoFrames(videoUrl, tempDir, {
        maxFrames,
        contextTime,
        query
      })

      // Convert frames to base64
      const framesWithData = await Promise.all(
        frameResults.map(async (frame) => {
          try {
            const imageBuffer = await readFile(frame.path)
            const base64Data = imageBuffer.toString('base64')
            
            // Clean up the file
            await unlink(frame.path).catch(() => {})
            
            return {
              timestamp: frame.timestamp,
              base64Data,
              confidence: frame.confidence || 0.8,
              description: frame.description || "Video frame"
            }
          } catch (error) {
            console.error(`Error processing frame ${frame.path}:`, error)
            return null
          }
        })
      )

      const validFrames = framesWithData.filter(frame => frame !== null)

      return NextResponse.json({
        success: true,
        frames: validFrames,
        totalExtracted: validFrames.length,
        videoId
      })

    } catch (extractionError) {
      console.error("Frame extraction error:", extractionError)
      return NextResponse.json({
        error: "Failed to extract frames",
        message: extractionError instanceof Error ? extractionError.message : "Unknown error",
        frames: []
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Extract frames API error:", error)
    return NextResponse.json({
      error: "Failed to process frame extraction request",
      message: error.message
    }, { status: 500 })
  }
}

async function extractVideoFrames(
  videoUrl: string, 
  outputDir: string, 
  options: {
    maxFrames: number
    contextTime: number
    query?: string
  }
): Promise<Array<{ timestamp: number; path: string; confidence?: number; description?: string }>> {
  
  const { maxFrames, contextTime } = options
  
  try {
    // Get video duration first
    const durationCmd = `yt-dlp --get-duration "${videoUrl}"`
    const { stdout: durationOutput } = await execAsync(durationCmd)
    const durationStr = durationOutput.trim()
    
    // Parse duration (format: HH:MM:SS or MM:SS)
    const durationParts = durationStr.split(':').map(Number)
    let totalSeconds = 0
    if (durationParts.length === 3) {
      totalSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
    } else if (durationParts.length === 2) {
      totalSeconds = durationParts[0] * 60 + durationParts[1]
    } else {
      totalSeconds = durationParts[0] || 600 // fallback
    }

    // Calculate strategic frame extraction times
    const frameTimes = calculateFrameTimes(totalSeconds, maxFrames, contextTime)
    
    const extractedFrames = []
    
    for (let i = 0; i < frameTimes.length; i++) {
      const timestamp = frameTimes[i]
      const outputPath = path.join(outputDir, `frame_${timestamp}s.jpg`)
      
      try {
        // Extract frame at specific timestamp
        const ffmpegCmd = `yt-dlp -f "best[height<=720]" --get-url "${videoUrl}" | head -1 | xargs -I {} ffmpeg -y -ss ${timestamp} -i "{}" -vframes 1 -q:v 2 "${outputPath}"`
        
        await execAsync(ffmpegCmd, { timeout: 30000 })
        
        if (existsSync(outputPath)) {
          extractedFrames.push({
            timestamp,
            path: outputPath,
            confidence: 0.85,
            description: `Frame at ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`
          })
        }
      } catch (frameError) {
        console.warn(`Failed to extract frame at ${timestamp}s:`, frameError)
      }
    }

    return extractedFrames

  } catch (error) {
    console.error("Video frame extraction failed:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract frames: ${error.message}`)
    } else {
      throw new Error("Failed to extract frames: Unknown error")
    }
  }
}

function calculateFrameTimes(duration: number, maxFrames: number, contextTime: number): number[] {
  const times = []
  
  // Always include context time if provided
  if (contextTime > 0 && contextTime < duration) {
    times.push(contextTime)
  }
  
  // Add strategic timestamps
  const interval = duration / (maxFrames - 1)
  
  for (let i = 0; i < maxFrames - 1; i++) {
    const timestamp = Math.floor(i * interval)
    if (timestamp !== contextTime && timestamp < duration) {
      times.push(timestamp)
    }
  }
  
  // Sort and ensure uniqueness
  return [...new Set(times)].sort((a, b) => a - b).slice(0, maxFrames)
}