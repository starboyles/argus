"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Clock } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

interface ChatInterfaceProps {
  videoId: string;
  videoData: any;
  currentTime: number;
  onSeekTo: (time: number) => void;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
}

export default function ChatInterface({
  videoId,
  videoData,
  currentTime,
  onSeekTo,
  messages,
  onSendMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Find the scrollable viewport within the ScrollArea
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollViewport && messagesEndRef.current) {
      scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }
  }, [messages, isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input;
    setInput(""); // Clear input immediately
    setIsLoading(true);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    console.log("New chat requested");
  };

  return (
    <div className="h-[600px] flex flex-col bg-white">
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Video Chat</h2>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 rounded-full px-4"
          onClick={handleNewChat}
        >
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
        <div className="py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 max-w-[80%]">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-700 text-sm leading-relaxed max-w-[90%]">
                    {message.content}
                  </div>

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

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
  );
}
