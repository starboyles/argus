"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Clock } from "lucide-react"

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

interface ChatInterfaceProps {
  videoId: string
  videoData: any
  currentTime: number
  onSeekTo: (time: number) => void
}

export default function ChatInterface({ videoId, videoData, currentTime, onSeekTo }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I've analyzed your video and I'm ready to answer questions about its content. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shouldScrollOnNextMessage, setShouldScrollOnNextMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll function - only for chat container
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      })
    }
  }

  // Only scroll when user sends a new message
  useEffect(() => {
    if (shouldScrollOnNextMessage) {
      scrollToBottom()
      setShouldScrollOnNextMessage(false)
    }
  }, [messages, shouldScrollOnNextMessage])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    // Trigger scroll when user sends a message
    setShouldScrollOnNextMessage(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          videoId,
          videoData,
          currentTime,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
          citations: data.citations,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorData.content || "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the AI service. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[600px] flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Video Chat</h2>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 rounded-full px-4"
        >
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {message.role === "user" ? (
                /* User message - dark rounded rectangle */
                <div className="flex justify-end">
                  <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 max-w-[80%]">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ) : (
                /* Assistant message - plain text */
                <div className="space-y-4">
                  <div className="text-gray-700 text-sm leading-relaxed max-w-[90%]">{message.content}</div>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Clock className="w-4 h-4" />
                        Referenced timestamps
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                        {message.citations.map((citation, index) => (
                          <button
                            key={index}
                            onClick={() => onSeekTo(citation.startTime)}
                            className="block text-left text-sm text-blue-700 hover:text-blue-800 transition-colors"
                          >
                            {citation.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          
          {/* Invisible element at the bottom for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="w-full pr-12 border-gray-200 focus:border-gray-300 focus:ring-0 rounded-xl text-sm placeholder:text-gray-400"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600 p-2 h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}