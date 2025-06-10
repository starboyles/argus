"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import VideoPlayer from "@/components/video-player"
import ChatInterface from "@/components/chat-interface"
import SectionBreakdown from "@/components/section-breakdown"
import FrameSearch from "@/components/frame-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import StatusIndicator from "@/components/status-indicator"

interface VideoData {
  id: string
  title: string
  description: string
  duration: number
  sections: Array<{
    id: string
    title: string
    startTime: number
    endTime: number
    description: string
  }>
  transcript: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  citations?: Array<{
    text: string
    startTime: number
    endTime: number
  }>
}

export default function VideoAnalysisPage() {
  const params = useParams()
  const videoId = params.id as string
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // CHAT STATE MOVED TO PARENT - THIS FIXES THE ISSUE
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I've analyzed your video and I'm ready to answer questions about its content. What would you like to know?",
      timestamp: new Date()
    }
  ])

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await fetch(`/api/video/${videoId}`)
        if (response.ok) {
          const data = await response.json()
          setVideoData(data)
        }
      } catch (error) {
        console.error("Error fetching video data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideoData()
  }, [videoId])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleSeekTo = (time: number) => {
    setCurrentTime(time)
  }

  // Chat message handlers
  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    // Add user message immediately
    setChatMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          videoId,
          videoData,
          currentTime,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          citations: data.citations,
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorData.content || "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to the AI service. Please try again.",
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading video analysis...</p>
        </div>
      </div>
    )
  }

  if (!videoData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Video not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <VideoPlayer
                videoId={videoId}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                onSeekTo={handleSeekTo}
              />
              <div className="mt-4">
                <h1 className="text-xl font-bold">{videoData.title}</h1>
                <p className="text-gray-600 mt-2">{videoData.description}</p>
                <StatusIndicator />
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <ChatInterface
                  videoId={videoId}
                  videoData={videoData}
                  currentTime={currentTime}
                  onSeekTo={handleSeekTo}
                  // PASS CHAT STATE AS PROPS
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                />
              </TabsContent>

              <TabsContent value="sections" className="mt-4">
                <SectionBreakdown 
                  sections={videoData.sections} 
                  currentTime={currentTime} 
                  onSeekTo={handleSeekTo} 
                />
              </TabsContent>

              <TabsContent value="search" className="mt-4">
                <FrameSearch videoId={videoId} onSeekTo={handleSeekTo} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}