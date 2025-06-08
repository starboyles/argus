"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, MessageSquare, Search, Clock, Youtube, Upload, Loader2, Github, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function LandingPage() {
  const [videoUrl, setVideoUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [menuState, setMenuState] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrolled(scrollPosition > 20)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

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

  const handleGetStarted = () => {
    router.push("/analyze")
  }

  const handleGitHub = () => {
    window.open("https://github.com/starboyles/multi-modal-video-analysis-tool", "_blank")
  }

  return (
    <>
      {/* Header */}
      <header>
        <nav
          className={cn(
            "border-border/40 fixed z-20 w-full border-b transition-colors duration-150",
            scrolled && "bg-background/80 backdrop-blur-xl",
          )}
          data-state={menuState && "active"}
        >
          <div className="mx-auto max-w-5xl px-6 transition-all duration-300">
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                <Link className="flex items-center space-x-2" aria-label="home" href="/">
                  <div className="flex items-center space-x-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"></path><path d="M8 4C8 2.34315 9.34315 1 11 1C12.6569 1 14 2.34315 14 4C14 4.35064 13.9398 4.68722 13.8293 5H20C20.5523 5 21 5.44772 21 6V9.12602C21 9.43517 20.857 9.72694 20.6127 9.91635C20.3683 10.1058 20.0501 10.1715 19.7507 10.0945C19.5119 10.033 19.2605 10 19 10C17.3431 10 16 11.3431 16 13C16 14.6569 17.3431 16 19 16C19.2605 16 19.5119 15.967 19.7507 15.9055C20.0501 15.8285 20.3683 15.8942 20.6127 16.0836C20.857 16.2731 21 16.5648 21 16.874V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V6C3 5.44772 3.44772 5 4 5H8.17071C8.06015 4.68722 8 4.35064 8 4Z"></path></svg>
                    <p className="text-foreground text-lg font-medium">Argus</p>
                  </div>
                </Link>

                <button
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                >
                  <Menu className="m-auto size-6 duration-200 in-data-[state=active]:scale-0 in-data-[state=active]:rotate-180 in-data-[state=active]:opacity-0" />
                  <X className="absolute inset-0 m-auto size-6 scale-0 -rotate-180 opacity-0 duration-200 in-data-[state=active]:scale-100 in-data-[state=active]:rotate-0 in-data-[state=active]:opacity-100" />
                </button>
              </div>

              <div className="bg-background border-border/40 mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-black/5 in-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:in-data-[state=active]:flex">
                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                  <Button variant="outline" className="rounded-full px-6" onClick={handleGitHub}>
                    <Github className="w-4 h-4 ml-2 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-20">
            <div className="mx-auto max-w-5xl px-6">
              <div className="sm:mx-auto lg:mt-0 lg:mr-auto">
                <h1 className="mt-8 max-w-2xl text-5xl font-medium text-balance md:text-6xl lg:mt-16">
                  Skip the scrubbing, ask the AI 👾
                </h1>
                <p className="mt-8 max-w-2xl text-lg text-pretty">
                  The intelligent unimodal video analysis tool with AI-powered chat. Upload any YouTube video and get instant
                  insights, section breakdowns, and interactive conversations about the content.
                </p>

                <div className="mt-12 flex items-center gap-2">

                  <Button asChild size="lg" className="rounded-xl px-5 text-base" onClick={handleGetStarted}>
                    <Link href="/analyze">
                      <span className="text-nowrap">Get Started</span>
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5 text-base">
                    <Link href="#features">
                      <span className="text-nowrap">Learn More</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Video Input Section */}
            <div className="relative mt-8 px-6 sm:mt-12 md:mt-20">
              <div className="mx-auto max-w-5xl">
                <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Try it now</h3>
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
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="mt-8 px-6 sm:mt-12 md:mt-20">
          <div className="mx-auto max-w-5xl">
            <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-[400px] sm:h-[500px]">
                {/* Video Player Preview */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-400 p-4">
                    <Play className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg">Video Player Interface</p>
                    <p className="text-sm opacity-75">Interactive video with AI-powered analysis</p>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="font-medium text-gray-900">Video Chat</h3>
                    <Button size="sm" className="bg-gray-900 text-white rounded-full px-3">
                      New Chat
                    </Button>
                  </div>

                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="bg-gray-900 text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ml-4 sm:ml-8">
                      <p className="text-sm">What are the main topics covered in this video?</p>
                    </div>

                    <div className="text-gray-700 text-sm leading-relaxed">
                      This video covers several key programming concepts including variables, functions, and data
                      structures. The main sections are:
                    </div>

                    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 space-y-2">
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
          </div>
        </section>

        {/* Features Section */}
        {/* Features Section */}
        <section id="features" className="mt-8 px-6 py-12 sm:mt-12 sm:py-16 md:mt-20 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <MessageSquare className="w-7 sm:w-8 h-7 sm:h-8 text-gray-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-3 sm:mb-4">AI-Powered Chat</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  Interactive conversations about video content with intelligent responses and timestamp citations.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Clock className="w-7 sm:w-8 h-7 sm:h-8 text-gray-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-3 sm:mb-4">Smart Sections</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  Automatic video segmentation with intelligent timestamps and clickable navigation.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Search className="w-7 sm:w-8 h-7 sm:h-8 text-gray-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-3 sm:mb-4">Visual Search</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  Find specific moments in videos using natural language descriptions of visual content.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Youtube className="w-7 sm:w-8 h-7 sm:h-8 text-gray-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-3 sm:mb-4">YouTube Integration</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  Seamless integration with YouTube videos while maintaining privacy and control over your data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-gray-900">
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M8 4C8 2.34315 9.34315 1 11 1C12.6569 1 14 2.34315 14 4C14 4.35064 13.9398 4.68722 13.8293 5H20C20.5523 5 21 5.44772 21 6V9.12602C21 9.43517 20.857 9.72694 20.6127 9.91635C20.3683 10.1058 20.0501 10.1715 19.7507 10.0945C19.5119 10.033 19.2605 10 19 10C17.3431 10 16 11.3431 16 13C16 14.6569 17.3431 16 19 16C19.2605 16 19.5119 15.967 19.7507 15.9055C20.0501 15.8285 20.3683 15.8942 20.6127 16.0836C20.857 16.2731 21 16.5648 21 16.874V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V6C3 5.44772 3.44772 5 4 5H8.17071C8.06015 4.68722 8 4.35064 8 4Z"></path>
                </svg>
                <span className="text-gray-900 text-lg font-medium">Argus</span>
              </div>
              <span className="text-gray-600 text-xs sm:text-sm ml-2">© 2025 Argus, All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 text-gray-600 text-sm sm:text-base">
              <button className="hover:text-gray-900" onClick={handleGitHub}>
                GitHub
              </button>
              <button className="hover:text-gray-900">Privacy Policy</button>
              <button className="hover:text-gray-900">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
