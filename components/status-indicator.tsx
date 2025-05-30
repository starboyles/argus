"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Loader2, Zap } from "lucide-react"

export default function StatusIndicator() {
  const [status, setStatus] = useState<{
    youtubeApiConfigured: boolean
    groqApiConfigured: boolean
    message: string
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

  const hasGroq = status.groqApiConfigured
  const hasYoutube = status.youtubeApiConfigured

  return (
    <div className="space-y-2">
      {hasGroq && (
        <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
          <Zap className="w-4 h-4" />
          <span className="text-xs">Groq AI chat analysis active</span>
        </div>
      )}

      <div
        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
          hasYoutube
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
        }`}
      >
        {hasYoutube ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        <span className="text-xs">{status.message}</span>
      </div>
    </div>
  )
}
