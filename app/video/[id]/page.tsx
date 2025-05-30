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

export default function VideoAnalysisPage() {
  const params = useParams()
  const videoId = params.id as string
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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
                />
              </TabsContent>

              <TabsContent value="sections" className="mt-4">
                <SectionBreakdown sections={videoData.sections} currentTime={currentTime} onSeekTo={handleSeekTo} />
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
