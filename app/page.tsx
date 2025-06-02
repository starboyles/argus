"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, MessageSquare, Search, Clock, Youtube, Upload, Loader2, Github } from "lucide-react"

export default function LandingPage() {
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

  // Navigate to main analysis page
  const handleGetStarted = () => {
    router.push("/analyze")
  }

  // Navigate to GitHub
  const handleGitHub = () => {
    window.open("https://github.com/starboyles/multi-modal-video-analysis-tool", "_blank")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-medium text-gray-900">VideoAI</span>
          </div>
          <Button variant="outline" className="rounded-full px-6" onClick={handleGitHub}>
            <Github className="w-4 h-4 ml-2 mr-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-12 py-24">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-medium text-gray-900 leading-tight mb-8">
            Your videos,
            <br />
            reimagined with AI
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-16 max-w-2xl">
            The intelligent video analysis platform with AI-powered chat. Upload any YouTube video and get instant
            insights, section breakdowns, and interactive conversations about the content.
          </p>

          <div className="flex items-center gap-6 mb-20">
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
            <button className="text-gray-600 hover:text-gray-900 text-base font-medium">Learn More</button>
          </div>

          {/* Video Input */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Try it now</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="url"
                  placeholder="Paste any YouTube video URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="pl-12 pr-4 py-4 text-base border-gray-200 focus:border-gray-300 focus:ring-0 rounded-xl"
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="submit"
                disabled={isProcessing || !videoUrl}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 text-base font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Analyze Video
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="max-w-6xl mx-auto px-12 pb-24">
        <div className="bg-gray-900 rounded-3xl p-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
            {/* Video Player Preview */}
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Video Player Interface</p>
                <p className="text-sm opacity-75">Interactive video with AI-powered analysis</p>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="bg-white rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-gray-900">Video Chat</h3>
                <Button size="sm" className="bg-gray-900 text-white rounded-full px-3">
                  New Chat
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 ml-8">
                  <p className="text-sm">What are the main topics covered in this video?</p>
                </div>

                <div className="text-gray-700 text-sm leading-relaxed">
                  This video covers several key programming concepts including variables, functions, and data
                  structures. The main sections are:
                </div>

                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Clock className="w-4 h-4" />
                    Referenced timestamps
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-blue-700">2:15 - Introduction</div>
                    <div className="text-sm text-blue-700">5:30 - Core Concepts</div>
                    <div className="text-sm text-blue-700">12:45 - Examples</div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Input placeholder="Ask anything..." className="rounded-xl border-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">AI-Powered Chat</h3>
            <p className="text-gray-600 leading-relaxed">
              Interactive conversations about video content with intelligent responses and timestamp citations.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">Smart Sections</h3>
            <p className="text-gray-600 leading-relaxed">
              Automatic video segmentation with intelligent timestamps and clickable navigation.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">Visual Search</h3>
            <p className="text-gray-600 leading-relaxed">
              Find specific moments in videos using natural language descriptions of visual content.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">YouTube Integration</h3>
            <p className="text-gray-600 leading-relaxed">
              Seamless integration with YouTube videos while maintaining privacy and control over your data.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-gray-600">© 2025 VideoAI, All rights reserved</span>
          </div>
          <div className="flex items-center gap-8 text-gray-600">
            <button className="hover:text-gray-900">GitHub</button>
            <button className="hover:text-gray-900">Privacy Policy</button>
            <button className="hover:text-gray-900">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
