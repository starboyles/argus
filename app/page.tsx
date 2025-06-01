"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Youtube, Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)
  const router = useRouter()

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const validateUrl = (url: string) => {
    if (!url) {
      setIsValidUrl(false)
      setError("")
      return
    }

    const videoId = extractVideoId(url)
    if (videoId) {
      setIsValidUrl(true)
      setError("")
    } else {
      setIsValidUrl(false)
      setError("Please enter a valid YouTube URL")
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setVideoUrl(url)
    validateUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const videoId = extractVideoId(videoUrl)

    if (!videoId) {
      setError("Please enter a valid YouTube URL")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
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
      setError("Failed to process video. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
            <Youtube className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Video Analysis</h1>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              Transform any YouTube video into an interactive conversation. Analyze content, extract insights, and chat
              with your videos.
            </p>
          </div>
          <Badge variant="secondary" className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            AI-Powered Analysis
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-center">Get Started</CardTitle>
            <CardDescription className="text-center">Paste your YouTube video URL below to begin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="video-url" className="text-sm font-medium text-slate-700">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <Input
                    id="video-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={handleUrlChange}
                    disabled={isProcessing}
                    className={cn(
                      "pl-4 pr-10 h-12 text-base transition-all duration-200",
                      isValidUrl && "border-green-300 bg-green-50/50",
                      error && "border-red-300 bg-red-50/50",
                    )}
                  />
                  {videoUrl && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidUrl ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : error ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-base font-medium transition-all duration-200",
                  "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                  "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
                  isProcessing && "cursor-not-allowed",
                )}
                disabled={isProcessing || !isValidUrl}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </form>

            {/* Features List */}
            <div className="pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>Extract key insights and summaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>Interactive Q&A with video content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>Timestamp-based navigation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          Supports all public YouTube videos • Processing typically takes fewer seconds
        </p>
      </div>
    </div>
  )
}
