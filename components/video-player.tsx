"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  videoId: string
  currentTime: number
  onTimeUpdate: (time: number) => void
  onSeekTo: (time: number) => void
}

export default function VideoPlayer({ videoId, currentTime, onTimeUpdate, onSeekTo }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Simulate video duration (in a real app, this would come from YouTube API)
    setDuration(600) // 10 minutes
  }, [videoId])

  useEffect(() => {
    // In a real implementation, you'd use YouTube Player API to sync time
    const interval = setInterval(() => {
      if (isPlaying) {
        onTimeUpdate(currentTime + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    onSeekTo(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="w-full">
      {/* Video Embed */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="space-y-2">
            {/* Progress Bar */}
            <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="w-full" />

            {/* Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-white hover:bg-white/20">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
