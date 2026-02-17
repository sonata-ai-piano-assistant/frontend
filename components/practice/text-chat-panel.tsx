"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Send, Bot, Lightbulb } from "lucide-react"
import { useMIDIPerformance } from "@/components/midi/midi-performance-provider"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface TextChatPanelProps {
  onClose: () => void
}

export function TextChatPanel({ onClose }: TextChatPanelProps) {
  const { performanceAnalysis } = useMIDIPerformance()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your piano tutor assistant. How can I help you with your practice today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle sending a message
  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Show typing indicator
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(input),
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
  }

  // Generate a response based on user input
  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("how to play") || input.includes("show me")) {
      return "To play the C major scale, start with your right thumb on middle C. Then use your index finger for D, middle finger for E, thumb under for F, and so on. Would you like me to demonstrate?"
    }

    if (input.includes("what is") && (input.includes("c major") || input.includes("scale"))) {
      return "The C major scale consists of the notes C, D, E, F, G, A, B, and C. It's one of the most fundamental scales in music and has no sharps or flats."
    }

    if (input.includes("finger") || input.includes("fingering")) {
      return "For the C major scale, the standard right-hand fingering is: 1 (thumb) for C, 2 (index) for D, 3 (middle) for E, 1 (thumb) for F, 2 for G, 3 for A, 4 for B, and 5 (pinky) for the high C."
    }

    if (input.includes("tempo") || input.includes("speed")) {
      return "I recommend starting at a slow tempo of around 60 BPM to ensure accuracy. As you become more comfortable, gradually increase the tempo. Would you like me to adjust the tempo for you?"
    }

    if (input.includes("mistake") || input.includes("wrong")) {
      return "Don't worry about mistakes! They're an essential part of learning. Focus on playing slowly and accurately first, and speed will come naturally with practice."
    }

    if (input.includes("thank")) {
      return "You're welcome! I'm here to help you become a better pianist. Is there anything else you'd like to know?"
    }

    // Default response
    return "That's a great question about piano practice. Would you like me to explain more about the current lesson, provide technique tips, or help with something specific?"
  }

  // Suggest questions to the user
  const suggestedQuestions = [
    "How do I play this scale?",
    "What is the correct fingering?",
    "Can you slow down the tempo?",
    "Show me the next section",
  ]

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <motion.div
      className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-background border-l shadow-lg z-40"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <Card className="h-full flex flex-col rounded-none border-0">
        <CardHeader className="px-4 py-3 border-b flex-row justify-between items-center space-y-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Piano Tutor Chat
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src="/ai-tutor-avatar.png" alt="AI Tutor" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src="/placeholder.svg" alt="User" />
                        <AvatarFallback className="bg-primary/10">U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src="/ai-tutor-avatar.png" alt="AI Tutor" />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted border border-border">
                      <div className="flex space-x-1 items-center h-5">
                        <div
                          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "200ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: "400ms" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested questions */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Suggested questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                placeholder="Ask your piano tutor..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
