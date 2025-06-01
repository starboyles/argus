"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Loader2, Zap, Eye, Youtube, Sparkles } from "lucide-react"

export default function StatusIndicator() {
  const [status, setStatus] = useState<{
    youtubeApiConfigured: boolean
    geminiApiConfigured: boolean
    groqApiConfigured: boolean
    message: string
    status: string
    features: {
      basicAnalysis: boolean
      enhancedTranscripts: boolean
      aiVideoUnderstanding: boolean
      multimodalRAG: boolean
      visualFrameSearch: boolean
      intelligentSections: boolean
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/setup")
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        console.error("Error checking status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking system status...
      </div>
    )
  }

  if (!status) return null

  const hasGemini = status.geminiApiConfigured
  const hasYoutube = status.youtubeApiConfigured
  const features = status.features

  return (
    <div className="space-y-2">
      {/* Gemini 2.5 Status */}
      {hasGemini && (
        <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">Gemini 2.5 Multimodal AI Active</span>
          <div className="flex gap-1 ml-auto">
            {features.aiVideoUnderstanding && <Eye className="w-3 h-3" aria-label="Video Understanding" />}
            {features.visualFrameSearch && <Zap className="w-3 h-3" aria-label="Visual Search" />}
          </div>
        </div>
      )}

      {/* YouTube API Status */}
      <div
        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
          hasYoutube
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
        }`}
      >
        {hasYoutube ? <Youtube className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        <span className="text-xs">
          {hasYoutube ? "YouTube API: Enhanced transcripts available" : "YouTube API: Basic mode only"}
        </span>
      </div>

      {/* Feature Overview */}
      {hasGemini && (
        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-lg">
          <div className="font-medium mb-1">Available Features:</div>
          <div className="grid grid-cols-2 gap-1">
            {features.intelligentSections && <span>✓ AI Section Analysis</span>}
            {features.multimodalRAG && <span>✓ Multimodal RAG</span>}
            {features.visualFrameSearch && <span>✓ Visual Frame Search</span>}
            {features.aiVideoUnderstanding && <span>✓ Video Understanding</span>}
          </div>
        </div>
      )}

      {/* Main Status Message */}
      <div
        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
          status.status === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : status.status === "partial"
            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        {status.status === "ok" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="text-xs">{status.message}</span>
      </div>
    </div>
  )
}