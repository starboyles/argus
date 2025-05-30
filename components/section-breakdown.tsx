"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Clock } from "lucide-react"

interface Section {
  id: string
  title: string
  startTime: number
  endTime: number
  description: string
}

interface SectionBreakdownProps {
  sections: Section[]
  currentTime: number
  onSeekTo: (time: number) => void
}

export default function SectionBreakdown({ sections, currentTime, onSeekTo }: SectionBreakdownProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isCurrentSection = (section: Section) => {
    return currentTime >= section.startTime && currentTime <= section.endTime
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Video Sections
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[520px] p-4">
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`border rounded-lg p-4 transition-all ${
                  isCurrentSection(section) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{section.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{section.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {formatTime(section.startTime)} - {formatTime(section.endTime)}
                      </span>
                      <span>•</span>
                      <span>
                        {Math.floor((section.endTime - section.startTime) / 60)}m{" "}
                        {(section.endTime - section.startTime) % 60}s
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => onSeekTo(section.startTime)} className="shrink-0">
                    <Play className="w-3 h-3" />
                  </Button>
                </div>

                {isCurrentSection(section) && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Currently playing
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
