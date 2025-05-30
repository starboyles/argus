"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Youtube, Loader2 } from "lucide-react"
import StatusIndicator from "@/components/status-indicator"

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const videoId = extractVideoId(videoUrl)

    if (!videoId) {
      alert("Please enter a valid YouTube URL")
      return
    }

    setIsProcessing(true)

    try {
      // Process the video
      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, url: videoUrl }),
      })

      if (response.ok) {
        router.push(`/video/${videoId}`)
      } else {
        throw new Error("Failed to process video")
      }
    } catch (error) {
      console.error("Error processing video:", error)
      alert("Failed to process video. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Video Analysis</CardTitle>
          <CardDescription>Upload a YouTube video to start analyzing and chatting with its content</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusIndicator />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="video-url" className="block text-sm font-medium mb-2">
                YouTube Video URL
              </label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing || !videoUrl}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Video...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
