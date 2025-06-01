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
}