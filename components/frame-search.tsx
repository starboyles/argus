"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Play, ImageIcon } from "lucide-react"

interface SearchResult {
  id: string
  timestamp: number
  confidence: number
  description: string
  thumbnailUrl: string
}

interface FrameSearchProps {
  videoId: string
  onSeekTo: (time: number) => void
}

export default function FrameSearch({ videoId, onSeekTo }: FrameSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)

    try {
      const response = await fetch("/api/search-frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          videoId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
      }
    } catch (error) {
      console.error("Error searching frames:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Frame Search
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-[520px]">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for..."
            disabled={isSearching}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>

        <ScrollArea className="flex-1">
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <div className="flex gap-3">
                    <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium mb-1">{formatTime(result.timestamp)}</p>
                          <p className="text-xs text-gray-600 mb-2">{result.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Confidence: {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => onSeekTo(result.timestamp)}>
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !isSearching ? (
            <div className="text-center text-gray-500 mt-8">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No matching frames found</p>
            </div>
          ) : !query ? (
            <div className="text-center text-gray-500 mt-8">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Enter a description to search for specific frames</p>
            </div>
          ) : null}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
